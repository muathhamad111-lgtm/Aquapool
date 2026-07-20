<?php

namespace Database\Factories;

use App\Models\Branch;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Branch>
 */
class BranchFactory extends Factory
{
    protected $model = Branch::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name_ar' => 'فرع '.fake()->city(),
            'name_en' => fake()->city().' Branch',
            'country_ar' => 'المملكة العربية السعودية',
            'country_en' => 'Saudi Arabia',
            'region_ar' => fake()->city(),
            'region_en' => fake()->city(),
            'district_ar' => fake()->streetName(),
            'district_en' => fake()->streetName(),
            'street_ar' => fake()->streetAddress(),
            'street_en' => fake()->streetAddress(),
            'email' => fake()->safeEmail(),
            'phone' => fake()->phoneNumber(),
            'hours_ar' => 'السبت - الخميس · 9 صباحاً - 6 مساءً',
            'hours_en' => 'Sat - Thu · 9 AM - 6 PM',
            'sort_order' => fake()->numberBetween(1, 20),
            'is_published' => true,
        ];
    }

    public function unpublished(): static
    {
        return $this->state(fn () => ['is_published' => false]);
    }
}
