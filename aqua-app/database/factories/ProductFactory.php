<?php

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    protected $model = Product::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'title_ar' => fake()->words(3, true),
            'title_en' => fake()->words(3, true),
            'caption_ar' => fake()->sentence(),
            'caption_en' => fake()->sentence(),
            'category' => 'general',
            'image_url' => '/site/placeholder.jpg',
            'price_label_ar' => fake()->words(2, true),
            'price_label_en' => fake()->words(2, true),
            'sort_order' => fake()->numberBetween(1, 20),
            'is_published' => true,
        ];
    }
}
