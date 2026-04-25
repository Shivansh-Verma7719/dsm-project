import { InteractiveMap } from "@/components/interactive-map";
import { PredictionSimulator } from "@/components/prediction-simulator";

export default function Home() {
  return (
    <div className="flex flex-col gap-16 pb-16">
      
      {/* Hero Section */}
      <section className="text-center pt-12 pb-8 max-w-4xl mx-auto space-y-4">
        <h1 className="text-5xl font-extrabold tracking-tight lg:text-6xl text-foreground">
          Empirical Securities Market Analysis
        </h1>
        <p className="text-xl text-default-500 max-w-2xl mx-auto">
          Interactive dashboard exploring the socioeconomic and behavioral determinants of household participation in the Indian securities market.
        </p>
      </section>

      {/* Map Section */}
      <section className="space-y-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold tracking-tight">Geographic Disparity</h2>
          <p className="text-default-500">Explore the penetration of securities investors across Indian states. Hover over states to view detailed socioeconomic metrics.</p>
        </div>
        <InteractiveMap />
      </section>

      {/* Prediction Simulator Section */}
      <section className="space-y-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold tracking-tight">Predictive Modeler</h2>
          <p className="text-default-500">
            Adjust the sliders below to see how demographics and behavioral psychographics affect market participation, asset choice, and holding duration.
          </p>
        </div>
        <PredictionSimulator />
      </section>

    </div>
  );
}