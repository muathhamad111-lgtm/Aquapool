<?php

namespace Database\Factories;

use App\Models\Message;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Message>
 */
class MessageFactory extends Factory
{
    protected $model = Message::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->safeEmail(),
            'phone' => fake()->phoneNumber(),
            'city' => fake()->city(),
            'project_type' => fake()->randomElement(['villa', 'commercial', 'hotel', 'renovation']),
            'budget' => fake()->randomElement(['under-10k', '10k-50k', '50k-100k', 'over-100k']),
            'timeline' => fake()->randomElement(['immediate', '1-3-months', '3-6-months', 'planning']),
            'subject' => fake()->sentence(4),
            'message' => fake()->paragraph(),
            'status' => 'new',
        ];
    }
}
