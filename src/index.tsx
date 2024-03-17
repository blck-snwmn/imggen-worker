import { Resvg, initWasm } from "@resvg/resvg-wasm";
import { Parser, jaModel } from "budoux";
import { Hono } from "hono";
import React from "react";
import satori from "satori";
import resvgWasm from "./vendor/resvg.wasm";

const parser = new Parser(jaModel);

await initWasm(resvgWasm);

const app = new Hono();

app.get("/image", async (c) => {
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
	const fontData = await fontDataResp.arrayBuffer();

	console.log("Font data", fontData.byteLength);

	const dummyText =
		"猫が犬と一緒に公園で絵を描いていた。その絵は宇宙飛行士になりたいバナナの夢を表現していた。するとバナナは突然踊り出し、猫と犬は驚いて逃げ出した。翌日、猫と犬がバナナを探しに行くと、バナナはすでに旅に出発していた。猫とバナナが一緒にスーパーマーケットに行った。バナナは牛乳を買うつもりだったが、猫が魚を買うことを提案した。そこで、二人は魚を買うために海に向かった。海に着くと、猫はサーフィンを始めた。バナナは砂浜で日光浴をしながら、哲学について考えていた。その後、二人はピザを食べに行くことにした。しかし、ピザ屋に着くと、店はすでに閉まっていた。がっかりした猫とバナナは、代わりに公園に行き、星空を見ながらギターを弾いた。";

	const svg = await satori(
		<Component
			text={dummyText}
			iconUrl="https://avatars.githubusercontent.com/u/44711725?v=4"
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

	console.log("create svg");

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

interface ComponentProps {
	iconUrl?: string;
	text: string;
}

const Component: React.FC<ComponentProps> = ({ iconUrl, text }) => {
	const words = parser.parse(text);
	console.log(words);
	const spans = words.map((word, i) => {
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
