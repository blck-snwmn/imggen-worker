import { Resvg, initWasm } from "@resvg/resvg-wasm";
import { Parser, jaModel } from "budoux";
import { Hono } from "hono";
import React from "react";
import satori from "satori";
import resvgWasm from "./vendor/resvg.wasm";
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'

// initialize budoux parser
const parser = new Parser(jaModel);

// initialize resvg
await initWasm(resvgWasm);

// initialize zod schema
const schema = z.object({
	icon: z.string().url(),
	text: z.string().min(1).max(100),
})

const app = new Hono();

app.get("/image", zValidator("query", schema), async (c) => {
	const fontData = await getGoogleFont();

	const { icon, text } = c.req.valid('query')

	const svg = await satori(
		<Component
			text={text}
			iconUrl={icon}
		/>,
		{
			width: 1200,
			height: 630,
			fonts: [
				{
					name: "Roboto",
					data: fontData,
					weight: 400,
					style: "normal",
				},
			],
		},
	);

	const resvg = new Resvg(svg, {
		fitTo: {
			mode: "original",
		},
	});

	const pngData = resvg.render();
	const pngBuffer = pngData.asPng();
	return new Response(pngBuffer, {
		headers: {
			"Content-Type": "image/png",
		},
	});
});

export default app;

async function getGoogleFont() {
	const familyResp = await fetch(
		"https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700",
	);
	if (!familyResp.ok) {
		throw new Error("Failed to load font data");
	}
	const css = await familyResp.text();
	const resource = css.match(
		/src: url\((.+)\) format\('(opentype|truetype)'\)/,
	);
	if (!resource) {
		throw new Error("Failed to parse font data");
	}

	const fontDataResp = await fetch(resource[1]);
	return await fontDataResp.arrayBuffer();
}

interface ComponentProps {
	iconUrl?: string;
	text: string;
}

const Component: React.FC<ComponentProps> = ({ iconUrl, text }) => {
	const words = parser.parse(text);
	const spans = words.map((word, i) => {
		// biome-ignore lint/suspicious/noArrayIndexKey: show elements in a table
		return <span key={i}>{word}</span>;
	});
	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				padding: "60px 30px",
				width: "1200px",
				height: "630px",
				background: "#ADD8E6",
			}}
		>
			<div
				style={{
					display: "flex",
					flexDirection: "row",
					background: "white",
					alignItems: "center",
					height: "100%",
					width: "100%",
				}}
			>
				<img
					src={iconUrl}
					alt="Icon"
					style={{
						width: "150px",
						height: "150px",
						borderRadius: "50%",
						margin: "30px",
						border: "1px solid black",
					}}
				/>
				<div
					style={{
						display: "flex",
						flexDirection: "row",
						flexWrap: "wrap",
						width: "800px",
						fontSize: "25px",
					}}
				>
					{spans}
				</div>
			</div>
		</div>
	);
};
