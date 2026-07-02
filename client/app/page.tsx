import { TrackSearch } from "@/components/TrackSearch";
import { RoleCard } from "@/components/RoleCard";
import { RecentProductsLedger } from "@/components/RecentProductsLedger";

export default function HomePage() {
  return (
    <div className="space-y-14">
      <section>
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-stamp-rust">Chain of custody, on-chain</p>
        <h1 className="mt-2 font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">
          Every shipment, stamped at every hand it passes through.
        </h1>
        <p className="mt-3 max-w-2xl font-body text-ink-soft">
          From the factory floor to the customer&apos;s door, each handoff is recorded as an
          on-chain transaction. Enter a token ID below to verify a product is genuine and see
          its complete journey.
        </p>
        <div className="mt-6 max-w-xl">
          <TrackSearch />
        </div>
      </section>

      <section>
        
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <RoleCard
            href="/manufacturer"
            title="Manufacturer"
            description="Register a new product and mint its certificate of authenticity."
          />
          <RoleCard
            href="/shipper"
            title="Shipper"
            description="Log pickup and in-transit checkpoints as goods move."
          />
          <RoleCard
            href="/retailer"
            title="Retailer"
            description="Check in deliveries and finalize sales to consumers."
          />
          <RoleCard
            href="/admin"
            title="Admin"
            description="Grant or revoke manufacturer, shipper and retailer credentials."
          />
        </div>
      </section>

      <section>
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">Recently registered</h2>
        <div className="mt-3">
          <RecentProductsLedger />
        </div>
      </section>
    </div>
  );
}
