<?php

namespace Database\Seeders;

use App\Models\Message;
use Illuminate\Database\Seeder;

/**
 * Seeds the real rows exported (read-only) from the live Supabase
 * messages table — see database/seeders/fixtures/messages_from_supabase.json.
 *
 * The export was empty at the time this seeder was written (no messages
 * had been submitted in production yet) — this is a no-op until real
 * messages exist in the fixture, and is safe to run regardless.
 *
 * IDs are preserved exactly as exported. No other table references
 * messages.id, but this keeps the data real (not reset) and consistent
 * with how every other module's seeder works.
 *
 * Intentionally NOT run automatically on every deploy — run once manually
 * after the first migration, so a later redeploy can never clobber live
 * admin edits (e.g. status changes).
 */
class MessageSeeder extends Seeder
{
    public function run(): void
    {
        $exported = json_decode(
            file_get_contents(__DIR__.'/fixtures/messages_from_supabase.json'),
            true,
        );

        foreach ($exported as $row) {
            Message::updateOrCreate(['id' => $row['id']], [
                'name' => $row['name'],
                'email' => $row['email'],
                'phone' => $row['phone'],
                'city' => $row['city'],
                'project_type' => $row['project_type'],
                'budget' => $row['budget'],
                'timeline' => $row['timeline'],
                'subject' => $row['subject'],
                'message' => $row['message'],
                'status' => $row['status'],
                'created_at' => $row['created_at'],
            ]);
        }
    }
}
