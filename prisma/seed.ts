import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await prisma.admin.upsert({
      where: { email: adminEmail },
      update: { passwordHash },
      create: { email: adminEmail, passwordHash },
    });
    console.log(`admin user ready: ${adminEmail}`);
  } else {
    console.warn("ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin seed");
  }

  await prisma.work.createMany({
    data: [
      {
        slug: "ribbon-x-ribbon",
        numberLabel: "制作物 一",
        title: "RIBBON × RIBBON",
        dateLabel: "2024.12.20 – 2025.1.17",
        summary: "推し活用のグッズ交換プラットフォーム。",
        description:
          "プログラミング団体「Waffle College」テックキャリアコースの卒業ハッカソンにて作成。3人チームで開発し、リーダーとして進行管理・発案・バックエンド全般・一部フロントを担当。X（旧Twitter）での取引はトラブルにつながるケースも多く、初心者にはハードルが高い。Webアプリ化することで、その問題を解決しようとした。",
        demoUrl:
          "https://drive.google.com/file/d/1ZJjISRzDjwLuFuAbIdA6e7tVvkA1I8Fy/view?usp=drive_link",
        imageUrl: null,
        tags: ["Python", "Django", "SQLite", "ハッカソン", "Waffle College"],
        order: 1,
      },
      {
        slug: "ar-hatsune-miku",
        numberLabel: "制作物 二",
        title: "AR初音ミク",
        dateLabel: "2025.2.25 – 27",
        summary: "平面検出でアバターが出現するARアプリ。",
        description:
          "奈良先端科学技術大学院大学のスプリングセミナーにて作成。平面を検出すると土台が現れ、土台をタップするとアバターが出現し、音楽に合わせてモーションが動く仕組み。※3Dモデル、モーション、音楽は配布のものを使用。",
        demoUrl:
          "https://drive.google.com/file/d/13trF3FZ1fhXVxWNgtIecHPAVjkuiisH7/view?usp=drive_link",
        imageUrl: null,
        tags: ["C#", "Unity", "AR"],
        order: 2,
      },
      {
        slug: "jaist-go",
        numberLabel: "制作物 三",
        title: "JAIST GO",
        dateLabel: "2026.6.11 – 14",
        award: "優勝",
        summary: "学内用の配車マッチングアプリ。",
        description:
          "北陸先端科学技術大学院大学（JAIST）のTechサークルハッカソンに参加し、優勝を受賞。3人チームで開発し、全体の進行管理・掲示板・Mapの実装を担当。JAISTの立地条件では車がないと不便なことが多いが、車を持っていない学生も多い。そんな人のために作られた学内用の配車マッチングアプリ。ローカルな人気店を探すための口コミ機能も搭載。",
        demoUrl:
          "https://drive.google.com/file/d/1iSNOiuo2X7fRO0yxZhOtWKeomiKYHGmZ/view?usp=drive_link",
        imageUrl: null,
        tags: ["Python", "Flask", "SQLite", "Google Maps API", "優勝", "ハッカソン"],
        order: 3,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.experience.createMany({
    data: [
      {
        org: "NPO法人「Waffle College」",
        dateLabel: "2024.5 – 2025.1",
        summary:
          "エントリー＆テックキャリアコースに参加。開発方面にてPythonを学び、卒業ハッカソンにてアプリ開発（RIBBON×RIBBON）を行った。",
        tags: ["Waffle", "Python", "ハッカソン"],
        order: 1,
      },
      {
        org: "「Waffle Camp」講師・メンター",
        dateLabel: "2024.8 / 2025.8",
        summary:
          "女子・ノンバイナリーの高校生によるプログラミング体験をサポートした。",
        tags: ["Waffle", "講師"],
        order: 2,
      },
      {
        org: "ビジネスコンテスト「CAREER ROOKIES」",
        dateLabel: "2024.10.14",
        summary:
          "学内予選を通過し、準決勝出場。3人チームで参加し、発案・サービス詳細・ビジネスモデルを担当。就活用マッチングサービス「Scout Bridge」を提案した。",
        tags: ["ビジネスコンテスト"],
        order: 3,
      },
      {
        org: "奈良先端科学技術大学院大学 スプリングセミナー",
        dateLabel: "2025.2.25 – 27",
        summary: "AR技術を用いたアプリ「AR初音ミク」を制作した。",
        tags: ["AR", "Unity"],
        order: 4,
      },
      {
        org: "JAIST Techサークル ハッカソン",
        dateLabel: "2026.6.11 – 14",
        summary: "3人チームで「JAIST GO」を開発し、優勝を受賞した。",
        tags: ["ハッカソン", "優勝"],
        order: 5,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.researchItem.createMany({
    data: [
      {
        stage: "学部での研究",
        title: "ジャクソン・ポロックの ≪1・第31番≫ における偶然と意図",
        summary:
          "ジャクソン・ポロックの《1・第31番》を研究対象とした。本作品は無意識的な描き方である「オートマティスム」と結びつけて評価されてきたが、詳細に分析すると線の流れ・色彩の配置・明暗のバランスなどに画面全体を意識的に構成する工夫が見られる。偶然性を取り込みながらも、意図的な構成によって成立した作品として捉え直した。",
        caption: "ジャクソン・ポロック ≪1・第31番≫　1950年、ニューヨーク近代美術館",
        imageUrl: null,
        tags: ["ポロック", "美術史"],
        order: 1,
      },
      {
        stage: "大学院での研究",
        title: "「ARを用いた美術鑑賞支援システム」の開発",
        summary:
          "美術の専門家が絵画を見るときの視線データを分析し、一般の鑑賞者が作品の重要な部分に自然に注目できるようにする（矢印や補助線、明度変化などのAR演出）。美術に詳しくない人でも絵画をより深く楽しめる体験を目指す。",
        caption: "図1：システム全体図",
        imageUrl: null,
        tags: ["AR", "美術鑑賞"],
        order: 2,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.otherActivity.createMany({
    data: [
      {
        title: "「戦後史を後世に伝えるプロジェクト」",
        dateLabel: "2022.10 – 2023.7",
        summary:
          "世田谷区立平和資料館にて「世田谷区民が送った兵営生活〜栗林一路さんを例に〜」を展示した。",
        order: 1,
      },
      {
        title: "NPO法人「Cafe de 寺子屋」",
        dateLabel: "2023.3 – 10",
        summary: "カフェのスペースを借りて小中学生の自主学習をサポートした。",
        order: 2,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.hobby.createMany({
    data: [
      { title: "ピアノ", body: "4歳の頃から今まで続けています。", order: 1 },
      { title: "茶道", body: "大学時代に部活動にて活動していました。", order: 2 },
      { title: "美術館巡り", body: "上野から各地の個展まで幅広く訪れています。", order: 3 },
      { title: "ゲーム", body: "音楽ゲーム、ノベルゲーム、TRPGなど。", order: 4 },
    ],
    skipDuplicates: true,
  });

  console.log("seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
