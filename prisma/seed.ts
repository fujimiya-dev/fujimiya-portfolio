import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Workも再実行のたびに古いデータを消してから入れ直す（重複防止）
  await prisma.work.deleteMany();
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
        comment: "準備中",
        teamSize: 3,
        role: "準備中",
        youtubeId: null,
        imageUrl: "/works/ribbon-ribbon.png",
        category: ["チーム開発", "ハッカソン"],
        techStack: ["Python", "Django", "SQLite"],
        order: 6,
      },
      {
        slug: "ar-hatsune-miku",
        numberLabel: "制作物 二",
        title: "AR初音ミク",
        dateLabel: "2025.2.25 – 27",
        summary: "平面検出でアバターが出現するARアプリ。",
        description:
          "奈良先端科学技術大学院大学のスプリングセミナーにて作成。平面を検出すると土台が現れ、土台をタップするとアバターが出現し、音楽に合わせてモーションが動く仕組み。※3Dモデル、モーション、音楽は配布のものを使用。",
        comment: "準備中",
        teamSize: 1,
        role: "準備中",
        youtubeId: null,
        imageUrl: "/works/ar-hatsune-miku.png",
        category: ["個人開発"],
        techStack: ["C#", "Unity", "AR"],
        order: 5,
      },
      {
        slug: "mynavi-service-growth-camp",
        numberLabel: "制作物 四",
        title: "Service Growth Camp",
        dateLabel: "2026.9.2 – 8",
        summary: "マイナビ主催のハッカソン型インターンでの制作物。",
        description:
          "マイナビ主催の5日間のハッカソン型インターンシップ「Service Growth Camp」に参加して制作。マイナビの技術スタックに倣った既存サービスを題材に、アイデア立案・要件定義・設計・実装をチームで行い、最終日にはサービス開発責任者へ向けてプレゼンテーションを実施した。\n※具体的な開発内容は守秘義務のため非公開です。ここに記載の情報は公開されているプログラム概要に基づいています。",
        comment: "準備中",
        teamSize: 5,
        role: "準備中",
        youtubeId: null,
        imageUrl: null,
        category: ["チーム開発", "ハッカソン", "ビジネス", "インターン"],
        techStack: ["TypeScript", "Next.js", "Express.js", "Prisma"],
        order: 3,
      },
      {
        slug: "jaist-go",
        numberLabel: "制作物 三",
        title: "JAIST GO",
        dateLabel: "2026.6.11 – 14",
        summary: "学内用の配車マッチングアプリ。",
        description:
          "北陸先端科学技術大学院大学（JAIST）のTechサークルハッカソンに参加。3人チームで開発し、全体の進行管理・掲示板・Mapの実装を担当。JAISTの立地条件では車がないと不便なことが多いが、車を持っていない学生も多い。そんな人のために作られた学内用の配車マッチングアプリ。ローカルな人気店を探すための口コミ機能も搭載。\n\n優勝を受賞",
        comment: "準備中",
        teamSize: 3,
        role: "準備中",
        youtubeId: null,
        imageUrl: "/works/jaist-go.png",
        category: ["チーム開発", "ハッカソン"],
        techStack: ["Python", "Flask", "SQLite", "Google Maps API"],
        order: 4,
      },
      {
        slug: "this-portfolio-site",
        numberLabel: "制作物 六",
        title: "このポートフォリオサイト",
        dateLabel: "2026.9.10-現在",
        summary: "このポートフォリオサイト自体の制作物。",
        description:
          "藤田都のポートフォリオサイト本体。Next.js（App Router）とTypeScriptで構築し、掲載内容はPrisma・PostgreSQL（Neon）とNextAuthによる自作の管理画面から更新できるようにして、コードを書き換えなくても作品・経歴・研究内容を追加できる設計にした。\n\nダークトーンのガラスパネル基調のデザインをサイト全体で統一し、Framer Motionでスクロール時にふわりと要素が浮かび上がる演出を加えている。日本語・英語2言語対応の辞書構造も最初から組み込んだ。\n\nWorksページの検索は、自由入力のキーワードをタグ化してサジェスト付きで絞り込めるようにしたほか、画像の縦横比に関わらずレイアウトが崩れないよう余白を持たせて表示する仕組みにもこだわった。",
        comment: "準備中",
        teamSize: 1,
        role: "全部",
        youtubeId: null,
        imageUrl: null,
        category: ["個人開発"],
        techStack: ["TypeScript", "Next.js", "Tailwind CSS", "Prisma", "Framer Motion"],
        order: 2,
      },
      {
        slug: "wip",
        numberLabel: "制作物 五",
        title: "Coming soon...",
        dateLabel: "2026.9-現在",
        summary: "Coming soon...",
        description: "Coming soon...",
        comment: "準備中",
        teamSize: 1,
        role: "準備中",
        youtubeId: null,
        imageUrl: null,
        category: ["個人開発"],
        techStack: ["C#"],
        order: 1,
      },
    ],
  });

  // Experienceは「その他の活動」を統合し、カテゴリタグを付け直すため、
  // 再実行のたびに古いデータを消してから入れ直す（重複防止）
  await prisma.experience.deleteMany();
  await prisma.experience.createMany({
    data: [
      {
        org: "「戦後史を後世に伝えるプロジェクト」",
        dateLabel: "2022.10 – 2023.7",
        summary:
          "世田谷区立平和資料館にて「世田谷区民が送った兵営生活〜栗林一路さんを例に〜」を展示した。",
        tags: ["史学", "地域活動"],
        order: 1,
      },
      {
        org: "NPO法人「Cafe de 寺子屋」",
        dateLabel: "2023.3 – 10",
        summary: "カフェのスペースを借りて小中学生の自主学習をサポートした。",
        tags: ["教育", "地域活動"],
        order: 2,
      },
      {
        org: "NPO法人「Waffle College」",
        dateLabel: "2024.5 – 2025.1",
        summary:
          "エントリー＆テックキャリアコースに参加。開発方面にてPythonを学び、卒業ハッカソンにてアプリ開発（RIBBON×RIBBON）を行った。",
        tags: ["チーム開発", "ハッカソン"],
        order: 3,
      },
      {
        org: "「Waffle Camp」講師・メンター",
        dateLabel: "2024.8 / 2025.8",
        summary:
          "女子・ノンバイナリーの高校生によるプログラミング体験をサポートした。",
        tags: ["教育", "チーム開発"],
        order: 4,
      },
      {
        org: "ビジネスコンテスト「CAREER ROOKIES」",
        dateLabel: "2024.10.14",
        summary:
          "学内予選を通過し、準決勝出場。3人チームで参加し、発案・サービス詳細・ビジネスモデルを担当。就活用マッチングサービス「Scout Bridge」を提案した。",
        tags: ["ビジネス"],
        order: 5,
      },
      {
        org: "奈良先端科学技術大学院大学 スプリングセミナー",
        dateLabel: "2025.2.25 – 27",
        summary: "AR技術を用いたアプリ「AR初音ミク」を制作した。",
        tags: ["個人開発"],
        order: 6,
      },
      {
        org: "JAIST Techサークル ハッカソン",
        dateLabel: "2026.6.11 – 14",
        summary: "3人チームで「JAIST GO」を開発し、優勝を受賞した。",
        tags: ["ハッカソン", "チーム開発"],
        order: 7,
      },
      {
        org: "マイナビ「Service Growth Camp」",
        dateLabel: "2026.9.2 – 8",
        summary:
          "5日間のハッカソン型インターンシップに参加。既存サービスを題材に、アイデア立案・要件定義・設計・実装をチームで行い、最終日にはサービス開発責任者へ向けてプレゼンテーションを実施した。",
        tags: ["インターン", "ハッカソン", "ビジネス", "チーム開発"],
        order: 8,
      },
    ],
  });

  // Researchも再実行のたびに古いデータを消してから入れ直す（重複防止）
  await prisma.researchItem.deleteMany();
  await prisma.researchItem.createMany({
    data: [
      {
        slug: "pollock-1-31",
        stage: "学部での研究",
        title: "ジャクソン・ポロックの ≪1・第31番≫ における偶然と意図",
        summary:
          "ジャクソン・ポロックの《1・第31番》を研究対象とした。本作品は無意識的な描き方である「オートマティスム」と結びつけて評価されてきたが、詳細に分析すると線の流れ・色彩の配置・明暗のバランスなどに画面全体を意識的に構成する工夫が見られる。偶然性を取り込みながらも、意図的な構成によって成立した作品として捉え直した。",
        caption: "ジャクソン・ポロック ≪1・第31番≫　1950年、ニューヨーク近代美術館",
        imageUrl: "/research/pollock-1-31.png",
        tags: ["史学", "美術", "現代アート"],
        techStack: [],
        references: [
          "沢山遼『絵画の力学』書肆侃侃房、2020年。",
          "藤枝晃雄『Jackson Pollock』スカイドア、1994年。",
          "Clement Greenberg『グリーンバーグ批評選集』勁草書房、2022年。",
          "Sandra Zalman, \"Janet Sobel: Primitive Modern and the Origins of Abstract Expressionism,\" Woman's Art Journal, vol. 36, no. 2, 2015, pp. 20-29.",
        ],
        achievements: [],
        paperUrl: null,
        order: 1,
      },
      {
        slug: "ar-art-appreciation",
        stage: "大学院での研究",
        title: "「ARを用いた美術鑑賞支援システム」の開発",
        summary:
          "美術の専門家が絵画を見るときの視線データを分析し、一般の鑑賞者が作品の重要な部分に自然に注目できるようにする（矢印や補助線、明度変化などのAR演出）。美術に詳しくない人でも絵画をより深く楽しめる体験を目指す。",
        caption: "図1：システム全体図",
        imageUrl: "/research/ar-art-appreciation.png",
        tags: ["情報", "プロジェクションマッピング", "XR", "視線計測", "美術"],
        techStack: ["Unity"],
        references: [
          "[1] S. Vogt and S. Magnussen, \"Expertise in Pictorial Perception: Eye-Movement Patterns and Visual Memory in Artists and Laymen,\" Perception, vol. 36, pp. 91-100, 2007.",
          "[2] C. F. Nodine, P. J. Locher, and E. A. Krupinski, \"The Role of Formal Art Training on Perception and Aesthetic Judgment of Art Compositions,\" Leonardo, vol. 26, no. 3, pp. 219-227, 1993.",
          "[3] N. Techasarntikul, P. Ratsamee, J. Orlosky, T. Mashita, Y. Uranishi, K. Kiyokawa, and H. Takemura, \"Evaluation of Embodied Agent Positioning and Moving Interfaces for an AR Virtual Guide,\" ICAT-EGVE, pp. 25-32, 2019.",
          "[4] H. Guo, D. Zhao, L. Zhang, Y. Lin, and H. Xin, \"The Effectiveness of The Attention Guidance Mechanisms in VR Museum,\" Ergonomics in Design, vol. 77, Francisco Rebelo and Zihao Wang, Eds., AHFE International, 2023. [Online]. Available: http://doi.org/10.54941/ahfe1003378",
        ],
        achievements: [],
        paperUrl: null,
        order: 2,
      },
    ],
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
