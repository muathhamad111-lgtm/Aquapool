<?php

namespace Database\Factories;

use App\Enums\AuditAction;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AuditLog>
 */
class AuditLogFactory extends Factory
{
    protected $model = AuditLog::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $email = fake()->safeEmail();

        return [
            'user_id' => User::factory(),
            'user_email' => $email,
            'action' => fake()->randomElement(AuditAction::cases())->value,
            'entity_type' => fake()->randomElement(['service', 'project', 'product', 'message', 'setting', 'user']),
            'entity_id' => (string) fake()->uuid(),
            'entity_label' => fake()->sentence(3),
            'details' => null,
        ];
    }
}
