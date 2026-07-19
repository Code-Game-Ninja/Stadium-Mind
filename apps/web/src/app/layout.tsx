import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ShellLayout } from '@/components/ShellLayout';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'StadiumMind AI — AI Stadium Operating System for FIFA World Cup 2026',
  description:
    'StadiumMind AI unifies fans, volunteers, and organizers with AI journey planning, live stadium operations, crowd prediction, and decision support for FIFA World Cup 2026.',
};

import { Toaster } from 'react-hot-toast';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="min-h-screen font-sans text-slate-800 antialiased">
        <Toaster position="top-center" />
        <ShellLayout>{children}</ShellLayout>
      </body>
    </html>
  );
}
