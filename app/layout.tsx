import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";

import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "LeadFlow CRM",
	description:
		"Professional lead management CRM for managing all your customer data seamlessly",
	applicationName: "LeadFlow CRM",
	generator: "v0.app",
	icons: {
		icon: [
			{
				url: "/icon-light-32x32.png",
				media: "(prefers-color-scheme: light)",
			},
			{
				url: "/icon-dark-32x32.png",
				media: "(prefers-color-scheme: dark)",
			},
			{
				url: "/icon.svg",
				type: "image/svg+xml",
			},
		],
		apple: "/apple-icon.png",
	},
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 5,
	userScalable: true,
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#ffffff" },
		{ media: "(prefers-color-scheme: dark)", color: "#0f172a" },
	],
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang='en' className='dark bg-background' suppressHydrationWarning>
			<head suppressHydrationWarning>
				<Script
					id='suppress-aborterror-unhandledrejection'
					strategy='beforeInteractive'>
					{`(function(){try{var h=function(event){var r=event&&event.reason;var n=r&&typeof r==='object'&&'name'in r?String(r.name):'';var m=r&&typeof r==='object'&&'message'in r?String(r.message):String(r||'');if(n==='AbortError'||m.indexOf('The user aborted a request')!==-1){try{event.preventDefault();}catch(e){}try{if(event.stopImmediatePropagation){event.stopImmediatePropagation();}}catch(e){}}};window.addEventListener('unhandledrejection',h,true);}catch(e){}})();`}
				</Script>
				<meta name='apple-mobile-web-app-capable' content='yes' />
				<meta
					name='apple-mobile-web-app-status-bar-style'
					content='black-translucent'
				/>
				<meta
					name='apple-mobile-web-app-title'
					content='LeadFlow CRM'
				/>
				<link rel='apple-touch-icon' href='/apple-touch-icon.png' />
				<link rel='manifest' href='/manifest.json' />
			</head>
			<body
				className='font-sans antialiased bg-background text-foreground'
				suppressHydrationWarning>
				<AuthProvider>
					{children}
					{process.env.NODE_ENV === "production" && <Analytics />}
				</AuthProvider>
			</body>
		</html>
	);
}
