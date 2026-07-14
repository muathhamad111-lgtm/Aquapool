<?php

namespace Database\Factories;

use App\Models\Project;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Project>
 */
class ProjectFactory extends Factory
{
    protected $model = Project::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'title_ar' => fake()->words(3, true),
            'title_en' => fake()->words(3, true),
            'location_ar' => fake()->city(),
            'location_en' => fake()->city(),
            'category' => 'residential',
            'image_url' => '/site/placeholder.jpg',
            'year' => (string) fake()->numberBetween(2015, 2026),
            'is_featured' => false,
            'sort_order' => fake()->numberBetween(1, 20),
            'is_published' => true,
        ];
    }
}
