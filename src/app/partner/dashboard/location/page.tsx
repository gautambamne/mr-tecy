"use client";

import { PartnerLocationManager } from "../_components/PartnerLocationManager";

export default function PartnerLocationPage() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                    Service Location
                </h1>
                <p className="text-slate-500">
                    Manage where you are based. This helps us match you with nearby customers.
                </p>
            </div>

            <PartnerLocationManager />
        </div>
    );
}
