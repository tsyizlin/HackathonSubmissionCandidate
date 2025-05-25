import React from 'react';
import Head from 'next/head';
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <TooltipProvider>
      <div className={`flex min-h-screen flex-col ${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <Head>
          <title>CypherConfess</title>
          <meta name="description" content="Anonymous confession board that uses Waku for private messaging" />
          <meta property="og:title" content="CypherConfess" />
          <meta property="og:description" content="Anonymous confession board that uses Waku for private messaging" />
          <meta property="og:type" content="website" />
          <meta property="og:image" content="https://opengraph.b-cdn.net/production/images/62d96fb5-2821-4691-a7f8-41b240b48284.png?token=fhDGsFiV6qME7vI2E96jcePGsGdoScCjHIGxDzzJ8aE&height=630&width=1200&expires=33283614304" />
          <meta name="twitter:image" content="https://opengraph.b-cdn.net/production/images/62d96fb5-2821-4691-a7f8-41b240b48284.png?token=fhDGsFiV6qME7vI2E96jcePGsGdoScCjHIGxDzzJ8aE&height=630&width=1200&expires=33283614304" />
          <meta name="twitter:card" content="summary" />
          <meta name="twitter:title" content="CypherConfess" />
          <meta name="twitter:description" content="Anonymous confession board that uses Waku for private messaging" />
          <meta name="keywords" content="Waku, anonymous, confession, p2p, decentralized, cypherpunk" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        {children}

        <style jsx global>{`
          .terminal-display {
            font-family: var(--font-mono);
            letter-spacing: 0.5px;
          }
          
          .terminal-glow {
            box-shadow: 0 0 10px rgba(6, 243, 145, 0.3);
          }
          
          /* Add CRT screen curvature effect */
          .terminal-display::before {
            content: "";
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(
              ellipse at center,
              transparent 50%,
              rgba(0, 0, 0, 0.3) 100%
            );
            pointer-events: none;
            z-index: 9996;
          }
          
          /* Add subtle vignette effect */
          .terminal-display::after {
            content: "";
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(
              ellipse at center,
              transparent 60%,
              rgba(3, 33, 21, 0.4) 100%
            );
            pointer-events: none;
            z-index: 9995;
          }
        `}</style>
      </div>
    </TooltipProvider>
  );
};
