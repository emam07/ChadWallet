You are a senior Staff Frontend Engineer and Product Designer.

Your task is to build a production-ready landing page for ChadWallet using Next.js 15 App Router, TypeScript, TailwindCSS, shadcn/ui, Framer Motion, and modern React best practices.

IMPORTANT:

* Do NOT create mockup code.
* Do NOT create placeholder components.
* Do NOT leave TODO comments.
* Do NOT generate pseudo-code.
* Generate complete, working code.
* Every component must be responsive.
* Every animation must be smooth and performant.
* No TypeScript errors.
* No hydration issues.
* No broken imports.
* No accessibility violations.
* No console errors.
* No unused code.

────────────────────────────

# PROJECT CONTEXT

ChadWallet is a Solana-focused crypto trading wallet.

The landing page should feel like a billion-dollar crypto startup.

The design quality should exceed:

* Fomo.family
* Pump.fun
* Photon
* Bonk
* Dexscreener landing experiences

The page should feel:

* Premium
* Fast
* Viral
* Crypto-native
* Highly polished

NOT:

* Corporate SaaS
* Generic startup template
* Dashboard-looking homepage

────────────────────────────

# REFERENCE

Below I will paste the HTML source, React code, or screenshot extraction from Fomo.family.

Analyze it carefully.

DO NOT COPY IT.

Understand:

* layout
* pacing
* hierarchy
* interaction patterns
* animation strategy
* visual rhythm

Then design a significantly better ChadWallet experience.

REFERENCE START

[
<!DOCTYPE html><html lang="en"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="preload" as="image" href="/images/landing/space-bg.webp" fetchPriority="high"/><link rel="preload" as="image" href="/images/landing/astronaut-mobile.webp" fetchPriority="high"/><link rel="preload" as="image" href="/images/landing/astronaut.webp" fetchPriority="high"/><script async="" src="https://www.googletagmanager.com/gtag/js?id=G-7NZ4HJXCKG"></script><meta name="theme-color" content="#060510"/><title>fomo | Social Crypto Trading App &amp; Web Platform</title><meta name="description" content="Trade memecoins, altcoins, and stablecoins on the only social-first crypto platform. Follow traders, copy trades, and swap on web and mobile (fomo app). Never miss out again."/><meta property="og:title" content="fomo | Social Crypto Trading App &amp; Web Platform"/><meta property="og:description" content="Trade memecoins, altcoins, and stablecoins on the only social-first crypto platform. Follow traders, copy trades, and swap on web and mobile (fomo app). Never miss out again."/><meta property="og:image" content="https://fomo.family/images/og-image.png"/><meta property="og:image:type" content="image/png"/><meta property="og:image:width" content="1200"/><meta property="og:image:height" content="675"/><meta property="og:type" content="website"/><meta name="twitter:card" content="summary_large_image"/><meta name="twitter:site" content="@fomo"/><meta name="twitter:title" content="fomo | Social Crypto Trading App &amp; Web Platform"/><meta name="twitter:description" content="Trade memecoins, altcoins, and stablecoins on the only social-first crypto platform. Follow traders, copy trades, and swap on web and mobile (fomo app). Never miss out again."/><meta name="twitter:image" content="https://fomo.family/images/og-image.png"/><link rel="icon" href="/favicon.ico" sizes="any"/><link rel="icon" href="/favicon.svg" type="image/svg+xml"/><link rel="apple-touch-icon" href="/apple-touch-icon.png"/><link rel="manifest" href="/site.webmanifest"/><link rel="preload" href="/images/landing/space-bg.webp" as="image"/><link rel="preload" href="/images/landing/astronaut.webp" as="image" media="(min-width: 800px)"/><link rel="preload" href="/images/landing/astronaut-mobile.webp" as="image" media="(max-width: 799px)"/><link rel="modulepreload" href="/assets/manifest-a768518b.js"/><link rel="modulepreload" href="/assets/entry.client-egcke6pM.js"/><link rel="modulepreload" href="/assets/jsx-runtime-BhCRtzF3.js"/><link rel="modulepreload" href="/assets/chunk-OE4NN4TA-BDyvW_Lc.js"/><link rel="modulepreload" href="/assets/index-BaJTMi4I.js"/><link rel="modulepreload" href="/assets/root-B6ERxURC.js"/><link rel="modulepreload" href="/assets/sentry-CtUJASjR.js"/><link rel="modulepreload" href="/assets/QueryClientProvider-BOtyOV0R.js"/><link rel="modulepreload" href="/assets/ClientOnly-BqbRvUY3.js"/><link rel="modulepreload" href="/assets/Icon-Bt57aP_e.js"/><link rel="modulepreload" href="/assets/serviceWorker-DJHlXNmn.js"/><link rel="modulepreload" href="/assets/blurAllMode-BbWM47yu.js"/><link rel="modulepreload" href="/assets/referralCode-D-Z7LbcF.js"/><link rel="modulepreload" href="/assets/chains-CxhnF6AF.js"/><link rel="modulepreload" href="/assets/posthog-DP5_S7DQ.js"/><link rel="modulepreload" href="/assets/module-DX0PcBrK.js"/><link rel="modulepreload" href="/assets/preload-helper-DbVJV_UW.js"/><link rel="modulepreload" href="/assets/middleware-CBvPDhTB.js"/><link rel="modulepreload" href="/assets/react-BY8xLR9y.js"/><link rel="modulepreload" href="/assets/static-BM3PFZ9Z.js"/><link rel="modulepreload" href="/assets/ExternalLink-CeQvHefO.js"/><link rel="modulepreload" href="/assets/loginModal-B3tbibuf.js"/><link rel="modulepreload" href="/assets/links-By3rv7jS.js"/><link rel="modulepreload" href="/assets/home-B9N9Z-UB.js"/><link rel="modulepreload" href="/assets/cn-CMdRd_Bk.js"/><link rel="modulepreload" href="/assets/qr-code-styling-GwDkucT1.js"/><link rel="modulepreload" href="/assets/colors-7n-Z0HIs.js"/><script>/* eslint-disable */
/**
 * Synchronous pre-React redirect for the splash route. Imported by app/root.tsx
 * via `?raw` and inlined into the prerendered <head>, so it runs before paint
 * and before the SPA hydrates (the bundle is already service-worker cached, so
 * `/token` loads instantly). Handles two cases:
 *
 *  1. A returning logged-in user lands straight on the app.
 *  2. A Privy OAuth redirect callback is forwarded into the app so its exchange
 *     completes behind the blank app shell instead of flashing the splash.
 */
(function () {
  try {
    if (location.pathname !== "/") return;

    // Case 2 — Privy OAuth callback. The provider drops `privy_oauth_*` params
    // on `/`, but it completes the exchange on any page that mounts it (reading
    // the params from the URL + its stored nonce). Forward to `/token` carrying
    // the params: the authenticated layout shows a blank shell while logging in
    // rather than the marketing splash. Mirrors hasOAuthRedirectParams() in
    // app/util/login.ts — keep the param list in sync.
    const oauth = new URLSearchParams(location.search);
    if (
      oauth.has("privy_oauth_code") &&
      oauth.has("privy_oauth_state") &&
      oauth.has("privy_oauth_provider")
    ) {
      document.documentElement.style.display = "none";
      location.replace("/token" + location.search);
      return;
    }

    // Case 1 — returning logged-in user. Only the bare splash route; a non-empty
    // query keeps ?r= / ?blurAll for <App>.
    if (location.search) return;

    // No loop guard is needed. The app only ever sends a logged-out/invalid
    // session back to `/` via a client-side <Navigate> (logout handlers and
    // SaveAndRedirect), which never reloads the document — so this script can't
    // re-run on a bounce. And Privy clears `privy:refresh_token` on logout and on
    // a failed refresh, so by any full reload of `/` the presence check below is
    // already false. A valid session is sent to /token on every load.

    // Signal: presence of Privy's opaque refresh token. It can't be validated
    // client-side, but Privy clears it on logout and on a failed refresh, so a
    // stale token self-heals after one hop to /token. The value is stored
    // JSON-stringified, so a real token is wrapped in double quotes ("VybAq...");
    // check the leading quote for presence and exclude the double-quoted
    // "deprecated" sentinel — no need to JSON.parse.
    let hasSession = false;
    try {
      const raw = localStorage.getItem("privy:refresh_token");
      hasSession =
        typeof raw === "string" && raw[0] === '"' && raw !== '"deprecated"';
    } catch (error) {
      // localStorage blocked — fall back to the privy-session cookie marker.
      hasSession = /(?:^|; )privy-session=/.test(document.cookie);
    }
    if (!hasSession) return;

    // Blank the `/` frame the browser keeps painting during the cross-document
    // nav, so the splash never flashes before `/token` is ready.
    document.documentElement.style.display = "none";
    location.replace("/token");
  } catch (error) {}
})();
</script><link rel="stylesheet" href="/assets/root-BZtaj4xZ.css"/></head><body><div class="relative isolate flex flex-col min-h-svh bg-bg-primary overflow-x-hidden"><header class="items-center h-13 pt-3 px-5 justify-between hidden desktop:flex"><a aria-label="fomo home" class="flex items-center text-text-primary" href="/" data-discover="true"><svg class="h-6 w-18.75"><use href="/images/sprite.svg#fomo-logo"></use></svg></a><div class="flex gap-2"><a href="https://apps.apple.com/us/app/fomo-never-miss-out/id6741115427" aria-label="Download on the App Store" class="bg-white/20 backdrop-blur-md rounded-md hover:ring-white/40 hover:ring-1 hover:backdrop-blur-sm hover:opacity-90" target="_blank" rel="noopener noreferrer"><svg width="120" height="40" class="block"><use href="/images/sprite.svg#apple-cta"></use></svg></a><a href="https://play.google.com/store/apps/details?id=family.fomo.app" aria-label="Get it on Google Play" class="bg-white/20 backdrop-blur-md hover:ring-white/40 hover:ring-1 rounded-md hover:opacity-90 hover:backdrop-blur-sm" target="_blank" rel="noopener noreferrer"><svg width="135" height="40" class="block"><use href="/images/sprite.svg#google-cta"></use></svg></a><button class="bg-bg-secondary ring ring-bg-tertiary hover:bg-bg-secondary/80 h-10 px-5 rounded-lg font-bold">Login</button></div></header><main class="flex flex-col items-center justify-center flex-1 h-full w-full"><img src="/images/landing/space-bg.webp" alt="" aria-hidden="true" fetchPriority="high" class="absolute top-0 left-0 w-full -z-10 pointer-events-none select-none"/><div class="flex flex-col items-center gap-5 desktop:gap-8"><div class="flex flex-col gap-2 items-center text-center pt-10 px-6 desktop:pt-20"><svg height="160" class="text-text-primary w-90"><use href="/images/sprite.svg#fomo-logo"></use></svg><h1 class="text-[24px] leading-6 desktop:text-[40px] text-[#EAEDFF] text-center desktop:leading-12 tracking-tighter">where traders become legends.</h1><p class="desktop:text-[22px] text-[#D1D8FF99] text-center desktop:leading-6 tracking-tight">From memecoins to viral tokens, trade any crypto in seconds.</p></div><div class="flex gap-2 desktop:hidden"><a href="https://fomo.family/download" class="text-center z-2 bg-white/12 backdrop-blur-md border border-bg-tertiary rounded-xl text-lg font-bold w-50 py-3" target="_blank" rel="noopener noreferrer">Download app</a></div><div class="hidden desktop:flex gap-3"><button class="group items-center justify-center overflow-hidden bg-[#606AF780] hover:bg-[#606AF7CC] backdrop-blur-md transition-colors duration-150 py-3 w-50 rounded-xl text-lg font-bold border border-bg-tertiary z-2 hidden desktop:flex"><span>Start trading</span><div class="flex items-center overflow-hidden w-0 opacity-0 group-hover:w-7 group-hover:opacity-100 transition-all duration-150 ease-out"><svg class="size-5 stroke-2 rotate-180 ml-2 shrink-0"><use href="/images/sprite.svg#arrow"></use></svg></div></button><button class="z-2 group bg-white/12 hover:bg-white/20 backdrop-blur-md transition-colors duration-150 border border-bg-tertiary rounded-xl text-lg font-bold w-50 flex items-center justify-center overflow-hidden"><div class="flex items-center overflow-hidden w-0 opacity-0 group-hover:w-7 group-hover:opacity-100 transition-all duration-150 ease-out"><svg class="size-5 text-text-primary mr-2 shrink-0"><use href="/images/sprite.svg#download"></use></svg></div><span>Download app</span></button></div></div><img class="desktop:hidden animate-[float_10s_ease-in-out_infinite] -mt-16" src="/images/landing/astronaut-mobile.webp" alt="" fetchPriority="high"/><img src="/images/landing/astronaut.webp" alt="" class="hidden desktop:block h-130 -mt-20 object-contain animate-[float_4s_ease-in-out_infinite]" fetchPriority="high"/><div class="hidden desktop:flex flex-col items-center py-10 px-8 gap-3"><div class="font-mono font-bold text-accent-primary">NOW AVAILABLE ON WEB</div><h2 class="text-[60px] leading-14 tracking-tight text-center">trade from anywhere.<br/>never lose a beat.</h2><p class="text-[#EAEDFF99] text-[22px] tracking-tight">Open a trade on your phone, close it on your desktop — all in one app.</p><div class="relative -mt-15"><img src="/images/landing/fomo-desktop.webp" alt="" loading="lazy" class="w-[64vw]"/><img src="/images/landing/fomo-desktop-phone.webp" alt="" loading="lazy" class="w-[28vw] absolute -right-22 bottom-30 animate-[float_4s_ease-in-out_infinite]"/></div></div><div class="flex desktop:hidden relative text-center"><img src="/images/landing/fomo-mobile-app.webp" alt="" loading="lazy"/><div class="absolute bottom-0 px-8 flex flex-col gap-3"><h2 class="text-[36px] leading-9 tracking-tighter text-center">trade from anywhere. <br/>never lose a beat.</h2><p class="tracking-tight text-text-secondary leading-5">Pick up a trade on your phone, close it on your desktop — all in one app.</p></div></div><div class="pt-8 desktop:py-2 px-3 desktop:px-20 flex flex-col self-stretch min-[500px]:self-center gap-13 max-w-500"><div class="hidden desktop:flex flex-col gap-3"><h2 class="text-[60px] tracking-tighter leading-15">never miss out again</h2><p class="text-[#EAEDFF99] leading-6 text-[28px]">the only social-first trading app</p></div><div class="flex flex-col gap-3 desktop:gap-6"><div class="flex flex-col desktop:flex-row gap-3 desktop:gap-6 items-start"><div class="group flex-1 min-w-0 shrink pt-8 pb-0 rounded-[25px] flex flex-col overflow-hidden gap-2 border border-bg-tertiary hover:border-white/12 transition-colors duration-300 bg-bg-secondary aspect-square"><div class="font-mono text-accent-primary px-8 font-bold">LEADERBOARD</div><h3 class="text-[28px] leading-8 tracking-tight desktop:text-[36px] desktop:leading-10 px-8">become a legend, top the leaderboard</h3><div class="min-h-0 flex-1"><img loading="lazy" src="/images/landing/leaderboard.webp" alt="" class="w-full h-full object-contain object-bottom transition-transform duration-300 group-hover:scale-105"/></div></div><div class="group flex-1 min-w-0 shrink pt-8 pb-0 rounded-[25px] flex flex-col overflow-hidden gap-2 border border-bg-tertiary hover:border-white/12 transition-colors duration-300 bg-bg-secondary aspect-square"><div class="font-mono text-accent-primary px-8 font-bold">FEED</div><h3 class="text-[28px] leading-8 tracking-tight desktop:text-[36px] desktop:leading-10 px-8">discover and follow top traders</h3><div class="min-h-0 flex-1"><img loading="lazy" src="/images/landing/social-static.webp" alt="" class="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"/></div></div><div class="group flex-1 min-w-0 shrink pt-8 pb-0 rounded-[25px] flex flex-col overflow-hidden gap-2 border border-bg-tertiary hover:border-white/12 transition-colors duration-300 bg-bg-secondary aspect-square"><div class="font-mono text-accent-primary px-8 font-bold">ALERTS</div><h3 class="text-[28px] leading-8 tracking-tight desktop:text-[36px] desktop:leading-10 px-8">real time notifications for what the best are buying</h3><div class="min-h-0 flex-1 pb-8"><img loading="lazy" src="/images/landing/alerts-static.webp" alt="" class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"/></div></div></div><div class="flex flex-col desktop:flex-row gap-3 desktop:gap-6 items-start"><div class="group flex-1 min-w-0 shrink pt-8 pb-0 rounded-[25px] flex flex-col overflow-hidden gap-2 border border-bg-tertiary hover:border-white/12 transition-colors duration-300 bg-bg-secondary aspect-square"><div class="font-mono text-accent-primary px-8 font-bold">EASY ONBOARDING</div><h3 class="text-[28px] leading-8 tracking-tight desktop:text-[36px] desktop:leading-10 px-8">create an account in an instant</h3><div class="min-h-0 flex-1"><img loading="lazy" src="/images/landing/sign-in-static.webp" alt="" class="h-full w-full object-bottom object-contain transition-transform duration-300 group-hover:scale-105"/></div></div><div class="group flex-1 min-w-0 shrink pt-8 pb-0 rounded-[25px] flex flex-col overflow-hidden gap-2 border border-bg-tertiary hover:border-white/12 transition-colors duration-300 bg-bg-secondary aspect-square"><div class="font-mono text-accent-primary px-8 font-bold">ZERO COMPLEXITY</div><h3 class="text-[28px] leading-8 tracking-tight desktop:text-[36px] desktop:leading-10 px-8">multichain &amp; gasless</h3><div class="min-h-0 flex-1"><img loading="lazy" src="/images/landing/assets-static.webp" alt="" class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"/></div></div><div class="group flex-1 min-w-0 shrink pt-8 pb-0 rounded-[25px] flex flex-col overflow-hidden gap-2 border border-bg-tertiary hover:border-white/12 transition-colors duration-300 bg-bg-secondary aspect-square"><div class="font-mono text-accent-primary px-8 font-bold">ONE CLICK TO BUY</div><h3 class="text-[28px] leading-8 tracking-tight desktop:text-[36px] desktop:leading-10 px-8">fund with apple pay</h3><div class="min-h-0 flex-1 pb-8"><img loading="lazy" src="/images/landing/apple-pay-static.webp" alt="" class="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"/></div></div></div></div></div><div class="relative self-stretch flex items-center justify-center py-40 desktop:py-0"><img loading="lazy" src="/images/landing/legends.webp" alt="" class="absolute inset-0 w-full h-full bottom-0 object-cover"/><div class="absolute inset-x-0 top-0 h-40 bg-linear-to-b from-bg-primary to-transparent"></div><div class="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-bg-primary to-transparent"></div><div class="px-8 w-[80vw]"><div class="flex flex-col justify-center items-center aspect-square relative"><div class="flex flex-col gap-3 desktop:gap-6 items-center w-[70vw] relative z-10"><h2 class="text-[40px] leading-10 desktop:text-[60px] desktop:leading-15 tracking-tighter text-center">a trading app<br/>for the rest of us</h2><p class="desktop:text-[22px] text-text-secondary desktop:leading-7 tracking-tight text-center">join 500,000 traders making their name on fomo</p><div class="pt-6"><div class="flex gap-2 desktop:hidden"><a href="https://fomo.family/download" class="text-center z-2 bg-white/12 backdrop-blur-md border border-bg-tertiary rounded-xl text-lg font-bold w-50 py-3" target="_blank" rel="noopener noreferrer">Download app</a></div><div class="hidden desktop:flex gap-3"><button class="group items-center justify-center overflow-hidden bg-[#606AF780] hover:bg-[#606AF7CC] backdrop-blur-md transition-colors duration-150 py-3 w-50 rounded-xl text-lg font-bold border border-bg-tertiary z-2 hidden desktop:flex"><span>Start trading</span><div class="flex items-center overflow-hidden w-0 opacity-0 group-hover:w-7 group-hover:opacity-100 transition-all duration-150 ease-out"><svg class="size-5 stroke-2 rotate-180 ml-2 shrink-0"><use href="/images/sprite.svg#arrow"></use></svg></div></button><button class="z-2 group bg-white/12 hover:bg-white/20 backdrop-blur-md transition-colors duration-150 border border-bg-tertiary rounded-xl text-lg font-bold w-50 flex items-center justify-center overflow-hidden"><div class="flex items-center overflow-hidden w-0 opacity-0 group-hover:w-7 group-hover:opacity-100 transition-all duration-150 ease-out"><svg class="size-5 text-text-primary mr-2 shrink-0"><use href="/images/sprite.svg#download"></use></svg></div><span>Download app</span></button></div></div></div><img loading="lazy" src="/images/landing/inner-circle.webp" alt="" class="absolute inset-0 m-auto z-1 w-[35vw] desktop:w-[30vw] animate-[spin_30s_linear_infinite_reverse]"/><img loading="lazy" src="/images/landing/outer-circle.webp" alt="" class="absolute inset-0 m-auto z-1 w-screen desktop:w-[55vw] animate-[spin_45s_linear_infinite] desktop:max-w-275"/></div></div></div></main><footer class="px-10 pt-8 pb-12 flex flex-col desktop:flex-row gap-10 items-start justify-between"><div class="flex flex-col gap-6"><div class="flex flex-col gap-3"><a aria-label="fomo home" class="flex items-center text-text-primary" href="/" data-discover="true"><svg width="125" height="40"><use href="/images/sprite.svg#fomo-logo"></use></svg></a><div class="text-2xl text-text-secondary leading-7 tracking-tighter">where traders become legends.</div></div><div class="text-text-tertiary hidden desktop:block">© <!-- -->2026<!-- --> FOMO Labs Inc.</div></div><div class="flex items-start flex-col desktop:flex-row gap-8 desktop:gap-2"><div class="flex flex-col items-start gap-2 min-w-40"><div class="text-text-tertiary font-mono text-sm">ABOUT</div><a class="text-sm hover:text-text-secondary" href="/blog" data-discover="true">Blog</a><a class="text-sm hover:text-text-secondary" href="/answers" data-discover="true">FAQ</a><a class="text-sm hover:text-text-secondary" href="/affiliates" data-discover="true">Affiliates</a></div><div class="flex flex-col items-start gap-2 min-w-40"><div class="text-text-tertiary font-mono text-sm">SOCIAL</div><a href="https://discord.gg/fomofamily" class="text-sm hover:text-text-secondary" target="_blank" rel="noopener noreferrer">Discord</a><a href="https://x.com/fomo" class="text-sm hover:text-text-secondary" target="_blank" rel="noopener noreferrer">X/Twitter</a><a href="https://www.instagram.com/tryfomo" class="text-sm hover:text-text-secondary" target="_blank" rel="noopener noreferrer">Instagram</a><a href="https://www.youtube.com/channel/UCQAgxFZYn2GhYKrXG4ypnUg" class="text-sm hover:text-text-secondary" target="_blank" rel="noopener noreferrer">Youtube</a><a href="https://www.linkedin.com/company/tryfomo/" class="text-sm hover:text-text-secondary" target="_blank" rel="noopener noreferrer">LinkedIn</a></div><div class="flex flex-col items-start gap-2 min-w-40"><div class="text-text-tertiary font-mono text-sm">LEGAL</div><a class="text-sm hover:text-text-secondary" href="/privacy-policy" data-discover="true">Privacy Policy</a><a class="text-sm hover:text-text-secondary" href="/terms" data-discover="true">Terms of Service</a></div></div><div class="text-text-tertiary block desktop:hidden">© <!-- -->2026<!-- --> FOMO Labs Inc.</div></footer><script>
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function(){window.dataLayer.push(arguments);};
    window.gtag('js', new Date());
    window.gtag('config', "G-7NZ4HJXCKG", { send_page_view: false });
  </script></div><script>((storageKey2, restoreKey) => {
    if (!window.history.state || !window.history.state.key) {
      let key = Math.random().toString(32).slice(2);
      window.history.replaceState({ key }, "");
    }
    try {
      let positions = JSON.parse(sessionStorage.getItem(storageKey2) || "{}");
      let storedY = positions[restoreKey || window.history.state.key];
      if (typeof storedY === "number") {
        window.scrollTo(0, storedY);
      }
    } catch (error) {
      console.error(error);
      sessionStorage.removeItem(storageKey2);
    }
  })("react-router-scroll-positions", null)</script><script>window.__reactRouterContext = {"basename":"/","future":{"unstable_optimizeDeps":false,"unstable_passThroughRequests":false,"unstable_subResourceIntegrity":false,"unstable_trailingSlashAwareDataRequests":false,"unstable_previewServerPrerendering":false,"v8_middleware":false,"v8_splitRouteModules":false,"v8_viteEnvironmentApi":false},"routeDiscovery":{"mode":"initial"},"ssr":false,"isSpaMode":false};window.__reactRouterContext.stream = new ReadableStream({start(controller){window.__reactRouterContext.streamController = controller;}}).pipeThrough(new TextEncoderStream());</script><script type="module" async="">import "/assets/manifest-a768518b.js";
import * as route0 from "/assets/root-B6ERxURC.js";
import * as route1 from "/assets/static-BM3PFZ9Z.js";
import * as route2 from "/assets/home-B9N9Z-UB.js";
  
  window.__reactRouterRouteModules = {"root":route0,"layouts/static":route1,"routes/static/home":route2};

import("/assets/entry.client-egcke6pM.js");</script><!--$--><script>window.__reactRouterContext.streamController.enqueue("[{\"_1\":2,\"_3\":-5,\"_4\":-5},\"loaderData\",{},\"actionData\",\"errors\"]\n");</script><!--$?--><template id="B:0"></template><!--/$--><!--/$--><script id="_R_">requestAnimationFrame(function(){$RT=performance.now()});</script><div hidden id="S:0"><script>window.__reactRouterContext.streamController.close();</script></div><script>$RB=[];$RV=function(a){$RT=performance.now();for(var b=0;b<a.length;b+=2){var c=a[b],e=a[b+1];null!==e.parentNode&&e.parentNode.removeChild(e);var f=c.parentNode;if(f){var g=c.previousSibling,h=0;do{if(c&&8===c.nodeType){var d=c.data;if("/$"===d||"/&"===d)if(0===h)break;else h--;else"$"!==d&&"$?"!==d&&"$~"!==d&&"$!"!==d&&"&"!==d||h++}d=c.nextSibling;f.removeChild(c);c=d}while(c);for(;e.firstChild;)f.insertBefore(e.firstChild,c);g.data="$";g._reactRetry&&requestAnimationFrame(g._reactRetry)}}a.length=0};
$RC=function(a,b){if(b=document.getElementById(b))(a=document.getElementById(a))?(a.previousSibling.data="$~",$RB.push(a,b),2===$RB.length&&("number"!==typeof $RT?requestAnimationFrame($RV.bind(null,$RB)):(a=performance.now(),setTimeout($RV.bind(null,$RB),2300>a&&2E3<a?2300-a:$RT+300-a)))):b.parentNode.removeChild(b)};$RC("B:0","S:0")</script></body></html>]

REFERENCE END

────────────────────────────

# TECH STACK

Framework:

* Next.js 15 App Router
* TypeScript

Styling:

* TailwindCSS

Animation:

* Framer Motion

Icons:

* Lucide React

Fonts:

* Geist
* Inter

────────────────────────────

# BRANDING

Brand:
ChadWallet

Theme:
Dark

Primary Accent:
#00FFA3

Secondary Accent:
#6B5CFF

Background:
Deep black

Visual Style:
Cyberpunk × Solana × Apple-level polish

Use:

* subtle glow
* glassmorphism
* animated gradients
* noise overlays
* depth
* floating elements

Avoid:

* excessive neon
* childish crypto aesthetics
* meme clutter

────────────────────────────

# LANDING PAGE STRUCTURE

Create the following sections.

────────────────────────────

1. HERO SECTION

Requirements:

* Full viewport height
* Stunning first impression

Include:

Headline:

"Trade Solana Before Everyone Else"

Subheadline:

"Discover trending tokens, track whales, and execute trades instantly with ChadWallet."

Buttons:

* Download on App Store
* Get it on Google Play

Links:

Android:
https://play.google.com/store/apps/details?id=xyz.chadwallet.www

iPhone:
https://apps.apple.com/us/app/chadwallet/id6757367474

Add:

* animated background
* floating token cards
* parallax effects
* motion effects
* Solana-inspired gradients

Hero must feel alive.

────────────────────────────

2. ROTATING TOKEN BANNER

Top and bottom ticker.

Auto-scroll infinitely.

Display:

* token symbol
* price
* change %
* volume

Create realistic sample data.

Each item:

* hover animation
* clickable
* routes to /trade/[symbol]

Smooth continuous motion.

No janky marquee implementations.

────────────────────────────

3. FEATURES SECTION

3-column responsive layout.

Feature cards:

1. Discover Trends
2. Follow Smart Money
3. Trade Instantly
4. Real-Time Alerts
5. Secure Wallet
6. Lightning Fast Swaps

Requirements:

* animated entry
* glass cards
* hover interactions
* icon animations

────────────────────────────

4. LIVE MARKET PREVIEW

Create a fake-but-realistic market dashboard.

Include:

* token list
* price
* volume
* market cap
* gains

Must visually resemble premium trading software.

Animations:

* count-up effects
* flashing updates
* subtle movement

────────────────────────────

5. SOCIAL PROOF

Show:

* active traders
* daily volume
* swaps executed

Animated statistics.

Large typography.

────────────────────────────

6. HOW IT WORKS

Three steps:

1. Sign In
2. Connect Wallet
3. Trade

Timeline design.

Mobile responsive.

────────────────────────────

7. MOBILE APP SECTION

Show:

* floating phone mockup
* screenshots placeholders
* download CTA

Use realistic app presentation.

Premium quality.

────────────────────────────

8. FINAL CTA

Large conversion section.

Headline:

"Your Next 100x Starts Here"

Buttons:

* App Store
* Google Play

Strong visual impact.

────────────────────────────

9. FOOTER

Include:

* logo
* social icons
* navigation
* legal links

Modern crypto style.

────────────────────────────

# COMPONENT REQUIREMENTS

Create reusable components:

/components

* Hero.tsx
* TokenTicker.tsx
* Features.tsx
* MarketPreview.tsx
* Stats.tsx
* HowItWorks.tsx
* MobileApp.tsx
* CTA.tsx
* Footer.tsx

────────────────────────────

# ANIMATION REQUIREMENTS

Use Framer Motion extensively.

Requirements:

* staggered entrances
* hover transitions
* parallax motion
* floating objects
* scroll reveals

Avoid:

* excessive bounce
* cheap animations

Everything should feel premium.

────────────────────────────

# RESPONSIVENESS

Support:

* 320px mobile
* tablets
* laptops
* ultrawide displays

No horizontal scrolling.

No layout breaks.

────────────────────────────

# PERFORMANCE

Requirements:

* Lighthouse 90+
* optimized rendering
* lazy loading where appropriate
* minimal re-renders

────────────────────────────

# DELIVERABLE FORMAT

Think through the entire architecture first.

Then generate:

1. Folder structure
2. All component code
3. Tailwind classes
4. Utility helpers
5. Main page.tsx
6. Any required data files

Output complete code.

Do not stop midway.

Do not summarize.

Do not explain.

Generate all required files in full.
