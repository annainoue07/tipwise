import { TipCalculator } from "./TipCalculator";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-6">
      <h1 className="text-lg font-semibold">TipWise</h1>
      <TipCalculator />
    </main>
  );
}
