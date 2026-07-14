<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class CreateAdminCommand extends Command
{
    protected $signature = 'aqua:create-admin {email} {--password=} {--force}';

    protected $description = 'Create the first admin user. Refuses to run if an admin already exists unless --force is given.';

    public function handle(): int
    {
        $email = $this->argument('email');

        if (User::where('role', User::ROLE_ADMIN)->exists() && ! $this->option('force')) {
            $this->error('An admin already exists. Pass --force to create another one anyway.');

            return self::FAILURE;
        }

        $emailValidator = Validator::make(['email' => $email], [
            'email' => ['required', 'email', 'unique:users,email'],
        ]);

        if ($emailValidator->fails()) {
            $this->error($emailValidator->errors()->first());

            return self::FAILURE;
        }

        $password = $this->option('password') ?: $this->secret('Password (min 8 characters)');

        $passwordValidator = Validator::make(['password' => $password], [
            'password' => ['required', 'string', 'min:8'],
        ]);

        if ($passwordValidator->fails()) {
            $this->error($passwordValidator->errors()->first());

            return self::FAILURE;
        }

        User::create([
            'name' => Str::before($email, '@'),
            'email' => $email,
            'password' => $password,
            'role' => User::ROLE_ADMIN,
        ]);

        $this->info("Admin created: {$email}");

        return self::SUCCESS;
    }
}
