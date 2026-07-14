<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;

class ResetPasswordCommand extends Command
{
    protected $signature = 'aqua:reset-password {email} {--password=}';

    protected $description = 'Reset an existing user\'s password. Prompts securely if --password is not given.';

    public function handle(): int
    {
        $email = $this->argument('email');
        $user = User::where('email', $email)->first();

        if (! $user) {
            $this->error("No user found with email: {$email}");

            return self::FAILURE;
        }

        $password = $this->option('password') ?: $this->secret('New password (min 8 characters)');

        $passwordValidator = Validator::make(['password' => $password], [
            'password' => ['required', 'string', 'min:8'],
        ]);

        if ($passwordValidator->fails()) {
            $this->error($passwordValidator->errors()->first());

            return self::FAILURE;
        }

        $user->forceFill(['password' => $password])->save();

        $this->info("Password reset for: {$email}");

        return self::SUCCESS;
    }
}
