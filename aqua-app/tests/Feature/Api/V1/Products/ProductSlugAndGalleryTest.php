<?php

namespace Tests\Feature\Api\V1\Products;

use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The two invariants ProductService enforces on every write, so they can't
 * be bypassed by a controller, the admin UI, or a future caller:
 *   1. every product has a unique slug
 *   2. image_url is the cover, and the cover is always images[0]
 */
class ProductSlugAndGalleryTest extends TestCase
{
    use RefreshDatabase;

    private function payload(array $overrides = []): array
    {
        return [
            'title_ar' => 'مضخة',
            'title_en' => 'Water Pump',
            'category_id' => ProductCategory::factory()->create()->id,
            ...$overrides,
        ];
    }

    private function actingAsStaff(): User
    {
        return User::factory()->create();
    }

    public function test_a_slug_is_generated_from_the_english_title_when_none_is_sent(): void
    {
        $response = $this->actingAs($this->actingAsStaff(), 'sanctum')
            ->postJson('/api/v1/admin/products', $this->payload());

        $response->assertStatus(201)->assertJsonPath('data.slug', 'water-pump');
    }

    public function test_a_duplicate_slug_gets_a_numeric_suffix(): void
    {
        Product::factory()->create(['slug' => 'water-pump']);

        $response = $this->actingAs($this->actingAsStaff(), 'sanctum')
            ->postJson('/api/v1/admin/products', $this->payload());

        $response->assertStatus(201)->assertJsonPath('data.slug', 'water-pump-2');
    }

    /**
     * Str::slug() strips Arabic to an empty string. An empty slug would
     * violate the unique index on the second such product, so the service
     * falls back to a random one.
     */
    public function test_a_product_with_no_latin_title_still_gets_a_usable_slug(): void
    {
        $staff = $this->actingAsStaff();

        $first = $this->actingAs($staff, 'sanctum')
            ->postJson('/api/v1/admin/products', $this->payload(['title_en' => 'مضخة']));
        $second = $this->actingAs($staff, 'sanctum')
            ->postJson('/api/v1/admin/products', $this->payload(['title_en' => 'مضخة أخرى']));

        $first->assertStatus(201);
        $second->assertStatus(201);
        $this->assertNotEmpty($first->json('data.slug'));
        $this->assertNotSame($first->json('data.slug'), $second->json('data.slug'));
    }

    public function test_an_explicit_slug_is_respected(): void
    {
        $response = $this->actingAs($this->actingAsStaff(), 'sanctum')
            ->postJson('/api/v1/admin/products', $this->payload(['slug' => 'my-custom-slug']));

        $response->assertStatus(201)->assertJsonPath('data.slug', 'my-custom-slug');
    }

    public function test_a_slug_with_url_unsafe_characters_is_rejected(): void
    {
        $this->actingAs($this->actingAsStaff(), 'sanctum')
            ->postJson('/api/v1/admin/products', $this->payload(['slug' => 'not a slug!']))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['slug']);
    }

    /**
     * Renaming a product must not silently change its public URL — an
     * existing slug is a published address other pages may link to.
     */
    public function test_updating_a_product_keeps_its_existing_slug(): void
    {
        $product = Product::factory()->create(['slug' => 'original-slug', 'title_en' => 'Original']);

        $response = $this->actingAs($this->actingAsStaff(), 'sanctum')
            ->patchJson("/api/v1/admin/products/{$product->id}", $this->payload(['title_en' => 'Renamed']));

        $response->assertStatus(200)->assertJsonPath('data.slug', 'original-slug');
    }

    public function test_a_product_can_be_given_a_new_slug_explicitly(): void
    {
        $product = Product::factory()->create(['slug' => 'original-slug']);

        $response = $this->actingAs($this->actingAsStaff(), 'sanctum')
            ->patchJson("/api/v1/admin/products/{$product->id}", $this->payload(['slug' => 'new-slug']));

        $response->assertStatus(200)->assertJsonPath('data.slug', 'new-slug');
    }

    /**
     * Regression guard: re-saving a product with its own slug must not treat
     * that slug as a conflict with itself and append "-2".
     */
    public function test_resaving_a_product_with_its_own_slug_does_not_add_a_suffix(): void
    {
        $product = Product::factory()->create(['slug' => 'stable-slug']);

        $response = $this->actingAs($this->actingAsStaff(), 'sanctum')
            ->patchJson("/api/v1/admin/products/{$product->id}", $this->payload(['slug' => 'stable-slug']));

        $response->assertStatus(200)->assertJsonPath('data.slug', 'stable-slug');
    }

    /**
     * Regression guard: ProductSeeder and any other direct Eloquent write
     * bypass ProductService entirely. `slug` is NOT NULL, so without the
     * model's creating hook, seeding a fresh environment fails outright —
     * which is exactly what happened before that hook existed.
     */
    public function test_a_product_created_directly_through_eloquent_still_gets_a_slug(): void
    {
        $product = Product::create([
            'title_ar' => 'مضخة',
            'title_en' => 'Direct Pump',
            'category' => 'general',
        ]);

        $this->assertSame('direct-pump', $product->slug);
    }

    public function test_two_directly_created_products_do_not_collide(): void
    {
        $first = Product::create(['title_ar' => 'أ', 'title_en' => 'Same Title', 'category' => 'general']);
        $second = Product::create(['title_ar' => 'ب', 'title_en' => 'Same Title', 'category' => 'general']);

        $this->assertSame('same-title', $first->slug);
        $this->assertSame('same-title-2', $second->slug);
    }

    public function test_the_first_image_becomes_the_cover(): void
    {
        $response = $this->actingAs($this->actingAsStaff(), 'sanctum')
            ->postJson('/api/v1/admin/products', $this->payload([
                'images' => ['/one.jpg', '/two.jpg'],
            ]));

        $response->assertStatus(201);
        $response->assertJsonPath('data.image_url', '/one.jpg');
        $response->assertJsonPath('data.images', ['/one.jpg', '/two.jpg']);
    }

    public function test_reordering_the_gallery_moves_the_cover(): void
    {
        $product = Product::factory()->create(['image_url' => '/one.jpg', 'images' => ['/one.jpg', '/two.jpg']]);

        $response = $this->actingAs($this->actingAsStaff(), 'sanctum')
            ->patchJson("/api/v1/admin/products/{$product->id}", $this->payload([
                'images' => ['/two.jpg', '/one.jpg'],
            ]));

        $response->assertStatus(200)->assertJsonPath('data.image_url', '/two.jpg');
    }

    public function test_clearing_the_gallery_clears_the_cover(): void
    {
        $product = Product::factory()->create(['image_url' => '/one.jpg', 'images' => ['/one.jpg']]);

        $response = $this->actingAs($this->actingAsStaff(), 'sanctum')
            ->patchJson("/api/v1/admin/products/{$product->id}", $this->payload(['images' => []]));

        $response->assertStatus(200);
        $this->assertNull($response->json('data.image_url'));
        $this->assertSame([], $response->json('data.images'));
    }

    /**
     * The single-image admin form sends image_url and no images array. It
     * must not leave a stale gallery behind that contradicts the new cover —
     * the detail page would then show the old image while the catalogue
     * showed the new one.
     */
    public function test_sending_only_a_cover_replaces_the_first_gallery_image(): void
    {
        $product = Product::factory()->create([
            'image_url' => '/old.jpg',
            'images' => ['/old.jpg', '/second.jpg'],
        ]);

        $response = $this->actingAs($this->actingAsStaff(), 'sanctum')
            ->patchJson("/api/v1/admin/products/{$product->id}", $this->payload(['image_url' => '/new.jpg']));

        $response->assertStatus(200);
        $response->assertJsonPath('data.image_url', '/new.jpg');
        // The replaced cover leads; the rest of the gallery survives.
        $response->assertJsonPath('data.images', ['/new.jpg', '/second.jpg']);
    }

    public function test_creating_with_only_a_cover_seeds_the_gallery(): void
    {
        $response = $this->actingAs($this->actingAsStaff(), 'sanctum')
            ->postJson('/api/v1/admin/products', $this->payload(['image_url' => '/only.jpg']));

        $response->assertStatus(201);
        $response->assertJsonPath('data.images', ['/only.jpg']);
    }

    public function test_specification_groups_round_trip_through_a_write(): void
    {
        $specifications = [[
            'title_ar' => 'الخصائص الرئيسية',
            'title_en' => 'Key attributes',
            'fields' => [
                ['label_ar' => 'النوع', 'label_en' => 'Type', 'value_ar' => 'مسبح', 'value_en' => 'Pool'],
            ],
        ]];

        $created = $this->actingAs($this->actingAsStaff(), 'sanctum')
            ->postJson('/api/v1/admin/products', $this->payload(compact('specifications')));

        $created->assertStatus(201);
        $this->assertEquals(
            $specifications,
            $this->getJson('/api/v1/products/'.$created->json('data.slug'))->json('data.specifications'),
        );
    }

    public function test_a_specification_group_without_fields_is_rejected(): void
    {
        $this->actingAs($this->actingAsStaff(), 'sanctum')
            ->postJson('/api/v1/admin/products', $this->payload([
                'specifications' => [['title_en' => 'Key attributes']],
            ]))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['specifications.0.fields']);
    }

    /**
     * specifications is client-supplied nested data written straight into a
     * jsonb column — without a bound, one request could store an unbounded
     * document.
     */
    public function test_too_many_specification_groups_are_rejected(): void
    {
        $group = ['title_en' => 'Group', 'fields' => [['label_en' => 'a', 'value_en' => 'b']]];

        $this->actingAs($this->actingAsStaff(), 'sanctum')
            ->postJson('/api/v1/admin/products', $this->payload([
                'specifications' => array_fill(0, 21, $group),
            ]))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['specifications']);
    }

    public function test_too_many_images_are_rejected(): void
    {
        $this->actingAs($this->actingAsStaff(), 'sanctum')
            ->postJson('/api/v1/admin/products', $this->payload([
                'images' => array_fill(0, 21, '/image.jpg'),
            ]))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['images']);
    }
}
