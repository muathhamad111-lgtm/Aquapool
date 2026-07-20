<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('branches', function (Blueprint $table) {
            // UUID primary key, matching every other content table.
            $table->uuid('id')->primary();

            // Only the name is required in both languages, as with every
            // other module's title. The address parts are nullable because
            // a real branch may genuinely have no street or district, and
            // `pick()` on the frontend already falls back between languages.
            $table->string('name_ar');
            $table->string('name_en');

            $table->string('country_ar')->nullable();
            $table->string('country_en')->nullable();
            $table->string('region_ar')->nullable();
            $table->string('region_en')->nullable();
            $table->string('district_ar')->nullable();
            $table->string('district_en')->nullable();
            $table->string('street_ar')->nullable();
            $table->string('street_en')->nullable();

            $table->string('email')->nullable();
            $table->string('phone')->nullable();

            // Per branch, falling back to the site-wide `contact` setting
            // when empty — a second location often keeps different hours.
            $table->string('hours_ar')->nullable();
            $table->string('hours_en')->nullable();

            $table->integer('sort_order')->default(0);
            $table->boolean('is_published')->default(true);
            $table->timestamps();
        });

        $this->seedFromContactSetting();
    }

    public function down(): void
    {
        Schema::dropIfExists('branches');
    }

    /**
     * Turns the existing single `contact` site setting into the first
     * branch, so the contact page and footer are never empty between this
     * migration and the admin creating branches by hand.
     *
     * The setting stores one free-text address string, not structured
     * parts. The live value is "الرياض، المملكة العربية السعودية" —
     * region followed by country — so it is split on the comma. That is a
     * best-effort parse of one known row, not a general address parser:
     * anything it can't split lands in `region` whole, which still renders
     * correctly and takes the admin seconds to correct.
     */
    private function seedFromContactSetting(): void
    {
        $setting = DB::table('site_settings')->where('key', 'contact')->first();

        if (! $setting) {
            return;
        }

        $contact = json_decode($setting->value, true) ?: [];

        [$regionAr, $countryAr] = $this->splitAddress($contact['address_ar'] ?? null, '،');
        [$regionEn, $countryEn] = $this->splitAddress($contact['address_en'] ?? null, ',');

        DB::table('branches')->insert([
            'id' => (string) Str::uuid(),
            'name_ar' => 'الفرع الرئيسي',
            'name_en' => 'Main Branch',
            'country_ar' => $countryAr,
            'country_en' => $countryEn,
            'region_ar' => $regionAr,
            'region_en' => $regionEn,
            'email' => $contact['email'] ?? null,
            'phone' => $contact['phone'] ?? null,
            'hours_ar' => $contact['hours_ar'] ?? null,
            'hours_en' => $contact['hours_en'] ?? null,
            'sort_order' => 1,
            'is_published' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * @return array{0: ?string, 1: ?string} region, country
     */
    private function splitAddress(?string $address, string $separator): array
    {
        if (blank($address)) {
            return [null, null];
        }

        $parts = array_map('trim', explode($separator, $address, 2));

        return [$parts[0] ?: null, $parts[1] ?? null];
    }
};
