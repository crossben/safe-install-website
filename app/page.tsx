import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

import { Hero } from '@/sections/Hero';
import { Problem } from '@/sections/Problem';
import { HowItWorks } from '@/sections/HowItWorks';
import { Checks } from '@/sections/Checks';
import { PackageManagers } from '@/sections/PackageManagers';
import { WhyGo } from '@/sections/WhyGo';
import { Monitor } from '@/sections/Monitor';
import { CI } from '@/sections/CI';
import { Install } from '@/sections/Install';
import { Agents } from '@/sections/Agents';

export default function Page() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <Hero />
        <div className="hairline" />
        <Problem />
        <HowItWorks />
        <div className="hairline" />
        <Checks />
        <PackageManagers />
        <div className="hairline" />
        <WhyGo />
        <Monitor />
        <div className="hairline" />
        <CI />
        <Agents />
        <div className="hairline" />
        <Install />
      </main>
      <SiteFooter />
    </>
  );
}
