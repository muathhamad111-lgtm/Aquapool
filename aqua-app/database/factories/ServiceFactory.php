<?php

namespace Database\Factories;

use App\Models\Service;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Service>
 */
class ServiceFactory extends Factory
{
    protected $model = Service::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'icon' => fake()->randomElement(['droplets', 'gem', 'shield', 'sparkles', 'sun', 'wrench']),
            'title_ar' => fake()->words(3, true),
            'title_en' => fake()->words(3, true),
            'description_ar' => fake()->sentence(),
            'description_en' => fake()->sentence(),
            'sort_order' => fake()->numberBetween(1, 20),
            'is_published' => true,
        ];
    }
}
