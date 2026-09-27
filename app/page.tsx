import { Container } from "@/components/layout/container";
import { CoverageSection } from "@/features/home/components/coverage-section";
import { FaqSection } from "@/features/home/components/faq-section";
import { HomeHero, HomeHeroBackdrop } from "@/features/home/components/home-hero";
import { QuoteStartForm } from "@/features/quote/components/quote-start-form";

// Figma "SOAT al instante" (197:293) / "Home Mobile" (559:46).
// Desktop: 12-column grid on the 1120px content width; the form (5 columns = 448px)
// overlaps the hero panel and runs alongside the coverages. Mobile (Figma 559:46):
// hero copy inset 40px, form and coverages edge to edge at 20px.
export default function HomePage() {
  return (
    <div className="flex flex-col gap-12.5 pt-5 pb-12.5 lg:gap-20 lg:pt-20">
      <Container width="wide" className="relative">
        <HomeHeroBackdrop />
        <Container className="relative grid grid-cols-1 gap-y-5 px-0 lg:grid-cols-12 lg:gap-x-8 lg:gap-y-0 lg:px-10 xl:px-0">
          <div className="lg:col-span-7">
            <HomeHero />
          </div>
          <div className="lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1 lg:pt-31.5">
            <QuoteStartForm />
          </div>
          <div className="pt-15 lg:col-span-7 lg:pt-27.5">
            <CoverageSection />
          </div>
        </Container>
      </Container>
      <FaqSection />
    </div>
  );
}
