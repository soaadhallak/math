import bcrypt from "bcrypt";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import prisma from "../../src/config/database.js";

const __seedsDir = dirname(fileURLToPath(import.meta.url));
const LOCALES = ["en", "ar", "tr"];

function loadLocales() {
  const localesDir = join(__seedsDir, "../../src/locales");
  const locales = {};
  for (const code of LOCALES) {
    locales[code] = JSON.parse(
      readFileSync(join(localesDir, `${code}.json`), "utf8"),
    );
  }
  return locales;
}

async function seedAsasServices(prismaClient) {
  const services = [
    {
      slug: "web-design-and-development",
      imageSrc: "/assets/services/montage-web.svg",
      icon: "web",
      sort: 1,
      visionKey: "c1",
      name: {
        en: "Web Design & Development",
        ar: "تصميم وتطوير الويب",
        tr: "Web Tasarım ve Geliştirme",
      },
      description: {
        en: "Custom web solutions built with modern technologies to scale your business.",
        ar: "حلول ويب مخصصة ومبنية بأحدث التقنيات لتنمية أعمالك.",
        tr: "İşletmenizi büyütmek için modern teknolojilerle oluşturulmuş özel web çözümleri.",
      },
      shortName: {
        en: "Web Platforms",
        ar: "منصات الويب",
        tr: "Web Platformları",
      },
      shortDescription: {
        en: "Scalable and high-performance web applications.",
        ar: "تطبيقات ويب قابلة للتوسع وعالية الأداء.",
        tr: "Ölçeklenebilir ve yüksek performanslı web uygulamaları.",
      },
      features: {
        en: [
          {
            title: "Responsive Design",
            text: "Optimized for all screen sizes and devices.",
          },
          {
            title: "High Performance",
            text: "Lightning-fast load times and clean code.",
          },
          {
            title: "SEO Friendly",
            text: "Structured for maximum search engine visibility.",
          },
        ],
        ar: [
          {
            title: "تصميم متجاوب",
            text: "محسّن لجميع أحجام الشاشات والأجهزة.",
          },
          { title: "أداء عالي", text: "أوقات تحميل فائقة السرعة وكود نظيف." },
          { title: "متوافق مع SEO", text: "مهيكل لظهور أقصى في محركات البحث." },
        ],
        tr: [
          {
            title: "Duyarlı Tasarım",
            text: "Tüm ekran boyutları ve cihazlar için optimize edilmiştir.",
          },
          {
            title: "Yüksek Performans",
            text: "Şimşek hızıyla yükleme süreleri ve temiz kod.",
          },
          {
            title: "SEO Dostu",
            text: "Arama motoru görünürlüğünü en üst düzeye çıkarmak için yapılandırılmıştır.",
          },
        ],
      },
    },
    {
      slug: "artificial-intelligence",
      imageSrc: "/assets/services/montage-ai.svg",
      icon: "ai",
      sort: 2,
      visionKey: "c2",
      name: {
        en: "Artificial Intelligence",
        ar: "الذكاء الاصطناعي",
        tr: "Yapay Zeka",
      },
      description: {
        en: "Intelligent automation and machine learning solutions tailored to your workflow.",
        ar: "أتمتة ذكية وحلول تعلم الآلة مصممة خصيصاً لسير عملك.",
        tr: "İş akışınıza özel akıllı otomasyon ve makine öğrenimi çözümleri.",
      },
      shortName: {
        en: "AI Solutions",
        ar: "حلول الذكاء الاصطناعي",
        tr: "Yapay Zeka Çözümleri",
      },
      shortDescription: {
        en: "Integrate smart AI models and automation tools.",
        ar: "دمج نماذج الذكاء الاصطناعي الذكية وأدوات الأتمتة.",
        tr: "Akıllı yapay zeka modellerini ve otomasyon araçlarını entegre edin.",
      },
      features: {
        en: [
          {
            title: "Machine Learning",
            text: "Custom models trained on your business data.",
          },
          {
            title: "Process Automation",
            text: "Automate repetitive tasks and boost efficiency.",
          },
          {
            title: "Smart Analytics",
            text: "Deep insights powered by advanced AI algorithms.",
          },
        ],
        ar: [
          { title: "تعلم الآلة", text: "نماذج مخصصة مدربة على بيانات عملك." },
          {
            title: "أتمتة العمليات",
            text: "أتمتة المهام المتكررة وزيادة الكفاءة.",
          },
          {
            title: "تحليلات ذكية",
            text: "رؤى عميقة مدعومة بخوارزميات ذكاء اصطناعي متقدمة.",
          },
        ],
        tr: [
          {
            title: "Makine Öğrenimi",
            text: "İşletme verileriniz üzerinde eğitilmiş özel modeller.",
          },
          {
            title: "Süreç Otomasyonu",
            text: "Tekrarlayan görevleri otomatize edin ve verimliliği artırın.",
          },
          {
            title: "Akıllı Analitik",
            text: "Gelişmiş yapay zeka algoritmalarıyla desteklenen derinlemesine içgörüler.",
          },
        ],
      },
    },
    {
      slug: "iot-and-embedded-systems",
      imageSrc: "/assets/services/montage-smarthome.svg",
      icon: "smarthome",
      sort: 3,
      visionKey: "c3",
      name: {
        en: "IoT & Smart Systems",
        ar: "إنترنت الأشياء والأنظمة الذكية",
        tr: "IoT ve Akıllı Sistemler",
      },
      description: {
        en: "Smart home automation, embedded systems, and connected IoT solutions.",
        ar: "أتمتة المنازل الذكية، الأنظمة المضمنة، وحلول إنترنت الأشياء المتصلة.",
        tr: "Akıllı ev otomasyonu, gömülü sistemler ve bağlantılı IoT çözümleri.",
      },
      shortName: {
        en: "Smart Homes & IoT",
        ar: "المنازل الذكية وإنترنت الأشياء",
        tr: "Akıllı Evler ve IoT",
      },
      shortDescription: {
        en: "Connect and control your physical environment smartly.",
        ar: "قم بربط والتحكم ببيئتك الفعلية بذكاء.",
        tr: "Fiziksel ortamınızı akıllıca bağlayın ve kontrol edin.",
      },
      features: {
        en: [
          {
            title: "Home Automation",
            text: "Seamless integration with Home Assistant and smart devices.",
          },
          {
            title: "Embedded Systems",
            text: "Custom hardware and microcontroller programming.",
          },
          {
            title: "Remote Control",
            text: "Monitor and control your systems from anywhere.",
          },
        ],
        ar: [
          {
            title: "أتمتة المنازل",
            text: "تكامل سلس مع Home Assistant والأجهزة الذكية.",
          },
          {
            title: "الأنظمة المضمنة",
            text: "برمجة العتاد المخصص المتحكمات الدقيقة.",
          },
          {
            title: "التحكم عن بعد",
            text: "مراقبة والتحكم بأنظمتك من أي مكان.",
          },
        ],
        tr: [
          {
            title: "Ev Otomasyonu",
            text: "Home Assistant ve akıllı cihazlarla kusursuz entegrasyon.",
          },
          {
            title: "Gömülü Sistemler",
            text: "Özel donanım ve mikrodenetleyici programlama.",
          },
          {
            title: "Uzaktan Kumanda",
            text: "Sistemlerinizi her yerden izleyin ve kontrol edin.",
          },
        ],
      },
    },
    {
      slug: "cloud-services",
      imageSrc: "/assets/services/montage-cloud.svg",
      icon: "cloud",
      sort: 4,
      visionKey: "c4",
      name: {
        en: "Cloud Services",
        ar: "الخدمات السحابية",
        tr: "Bulut Hizmetleri",
      },
      description: {
        en: "Reliable cloud infrastructure, deployment, and server management.",
        ar: "بنية تحتية سحابية موثوقة، نشر، وإدارة خوادم.",
        tr: "Güvenilir bulut altyapısı, dağıtım ve sunucu yönetimi.",
      },
      shortName: {
        en: "Cloud Infrastructure",
        ar: "البنية التحتية السحابية",
        tr: "Bulut Altyapısı",
      },
      shortDescription: {
        en: "Secure and scalable cloud deployment solutions.",
        ar: "حلول نشر سحابية آمنة وقابلة للتوسع.",
        tr: "Güvenli ve ölçeklenebilir bulut dağıtım çözümleri.",
      },
      features: {
        en: [
          {
            title: "Server Setup",
            text: "Docker, VPS, and automated deployment pipelines.",
          },
          {
            title: "High Availability",
            text: "Ensure 99.9% uptime for your applications.",
          },
          {
            title: "Cloud Security",
            text: "Robust protection against data breaches.",
          },
        ],
        ar: [
          { title: "إعداد الخوادم", text: "Docker، VPS، وخطوط نشر آلية." },
          {
            title: "توافر عالي",
            text: "ضمان وقت تشغيل بنسبة 99.9% لتطبيقاتك.",
          },
          { title: "الأمان السحابي", text: "حماية قوية ضد اختراق البيانات." },
        ],
        tr: [
          {
            title: "Sunucu Kurulumu",
            text: "Docker, VPS ve otomatik dağıtım hatları.",
          },
          {
            title: "Yüksek Erişilebilirlik",
            text: "Uygulamalarınız için %99.9 çalışma süresi sağlayın.",
          },
          {
            title: "Bulut Güvenliği",
            text: "Veri ihlallerine karşı güçlü koruma.",
          },
        ],
      },
    },
    {
      slug: "cybersecurity",
      imageSrc: "/assets/services/montage-security.svg",
      icon: "security",
      sort: 5,
      visionKey: null,
      name: {
        en: "Cybersecurity",
        ar: "الأمن السيبراني",
        tr: "Siber Güvenlik",
      },
      description: {
        en: "Comprehensive security audits, penetration testing, and network protection.",
        ar: "تدقيقات أمنية شاملة، اختبار الاختراق، وحماية الشبكات.",
        tr: "Kapsamlı güvenlik denetimleri, sızma testi ve ağ koruması.",
      },
      shortName: {
        en: "Cybersecurity",
        ar: "الأمن السيبراني",
        tr: "Siber Güvenlik",
      },
      shortDescription: {
        en: "Protect your digital assets from advanced cyber threats.",
        ar: "احمِ أصولك الرقمية من التهديدات السيبرانية المتقدمة.",
        tr: "Dijital varlıklarınızı gelişmiş siber tehditlerden koruyun.",
      },
      features: {
        en: [
          {
            title: "Vulnerability Assessment",
            text: "Identify security gaps before they are exploited.",
          },
          {
            title: "Network Protection",
            text: "Secure local and cloud network perimeters.",
          },
          {
            title: "Penetration Testing",
            text: "Simulated attacks to test system resilience.",
          },
        ],
        ar: [
          {
            title: "تقييم الثغرات",
            text: "تحديد الفجوات الأمنية قبل استغلالها.",
          },
          {
            title: "حماية الشبكات",
            text: "تأمين محيطات الشبكات المحلية والسحابية.",
          },
          {
            title: "اختبار الاختراق",
            text: "هجمات محاكاة لاختبار مرونة النظام.",
          },
        ],
        tr: [
          {
            title: "Zafiyet Değerlendirmesi",
            text: "Güvenlik açıklarını istismar edilmeden önce belirleyin.",
          },
          {
            title: "Ağ Koruması",
            text: "Yerel ve bulut ağ çevrelerini güvence altına alın.",
          },
          {
            title: "Sızma Testi",
            text: "Sistem dayanıklılığını test etmek için simüle edilmiş saldırılar.",
          },
        ],
      },
    },
  ];

  const slugs = services.map((s) => s.slug);
  await prismaClient.service.deleteMany({ where: { slug: { notIn: slugs } } });

  for (const item of services) {
    const showOnHome = item.visionKey != null;
    const service = await prismaClient.service.upsert({
      where: { slug: item.slug },
      update: {
        imageSrc: item.imageSrc,
        icon: item.icon,
        sort: item.sort,
        status: true,
        showOnHome,
      },
      create: {
        slug: item.slug,
        imageSrc: item.imageSrc,
        icon: item.icon,
        sort: item.sort,
        status: true,
        showOnHome,
      },
    });

    await prismaClient.serviceMedia.deleteMany({
      where: { serviceId: service.id },
    });

    for (const code of LOCALES) {
      const name = item.name[code] || item.name["en"];
      const description = item.description[code] || item.description["en"];
      const shortName = item.shortName
        ? item.shortName[code] || item.shortName["en"]
        : name;
      const shortDescription = item.shortDescription
        ? item.shortDescription[code] || item.shortDescription["en"]
        : description;
      const features = item.features
        ? item.features[code] || item.features["en"] || []
        : [];

      const rows = [
        { field: "name", value: name },
        { field: "description", value: description },
        { field: "shortName", value: shortName },
        { field: "shortDescription", value: shortDescription },
        { field: "features", value: JSON.stringify(features) },
      ];

      for (const row of rows) {
        await prismaClient.serviceTranslation.upsert({
          where: {
            serviceId_locale_field: {
              serviceId: service.id,
              locale: code,
              field: row.field,
            },
          },
          update: { value: row.value, status: true },
          create: {
            serviceId: service.id,
            locale: code,
            field: row.field,
            value: row.value,
            status: true,
          },
        });
      }
    }
  }

  console.log(
    `Seeded ${services.length} Asas Soft services from internal array`,
  );
}

async function seedAsasProjects(prismaClient) {
  const categories = [
    {
      slug: "web",
      icon: "web",
      sort: 1,
      name: { en: "Web", ar: "ويب", tr: "Web" },
      description: {
        en: "Web platforms and product sites",
        ar: "منصات ومواقع ويب",
        tr: "Web platformları ve ürün siteleri",
      },
    },
    {
      slug: "mobile",
      icon: "mobile",
      sort: 2,
      name: { en: "Mobile", ar: "موبايل", tr: "Mobil" },
      description: {
        en: "iOS and Android applications",
        ar: "تطبيقات iOS و Android",
        tr: "iOS ve Android uygulamaları",
      },
    },
    {
      slug: "erp",
      icon: "erp",
      sort: 3,
      name: { en: "ERP", ar: "ERP", tr: "ERP" },
      description: {
        en: "Business systems and operations tools",
        ar: "أنظمة أعمال وأدوات تشغيل",
        tr: "İş sistemleri ve operasyon araçları",
      },
    },
    {
      slug: "design",
      icon: "design",
      sort: 4,
      name: { en: "Design", ar: "تصميم", tr: "Tasarım" },
      description: {
        en: "Brand and UI design work",
        ar: "أعمال هوية وتصميم واجهات",
        tr: "Marka ve arayüz tasarımı",
      },
    },
  ];

  const projects = [
    {
      slug: "prime-gate",
      categorySlug: "web",
      imageSrc: "/assets/images/projects/prime-gate.jpg",
      externalUrl: "https://primegateco.com",
      isFeatured: true,
      sort: 1,
      name: {
        en: "Prime Gate",
        ar: "برايم جيت",
        tr: "Prime Gate",
      },
      description: {
        en: "Corporate website for a global natural-resources trading and export company.",
        ar: "موقع تعريفي لشركة عالمية لتجارة وتصدير الموارد الطبيعية.",
        tr: "Küresel doğal kaynak ticareti ve ihracatı yapan bir şirket için kurumsal web sitesi.",
      },
    },
    {
      slug: "eva-group",
      categorySlug: "web",
      isFeatured: true,
      imageSrc: "/assets/images/projects/eva-grup.jpg",
      externalUrl: "https://evagrup.com",
      sort: 2,
      name: {
        en: "Eva Group",
        ar: "مجموعة إيفا",
        tr: "Eva Grup",
      },
      description: {
        en: "Architecture studio site showcasing modern spaces shaped by design and materials.",
        ar: "موقع لاستوديو معماري يعرض مساحات حديثة تجمع بين التصميم والمواد.",
        tr: "Tasarım ve malzemeyle şekillenen çağdaş mekânları sergileyen mimarlık stüdyosu sitesi.",
      },
    },
    {
      slug: "narko-gold",
      categorySlug: "web",
      isFeatured: true,
      imageSrc: "/assets/images/projects/narko-gold.jpg",
      externalUrl: "https://narkogold.com",
      sort: 3,
      name: {
        en: "NARKO GOLD",
        ar: "ناركو جولد",
        tr: "NARKO GOLD",
      },
      description: {
        en: "Jewellery storefront for certified gold, bullion, and silver trading in Mersin.",
        ar: "واجهة متجر لمجوهرات ذهب معتمدة وسبائك وفضة في مرسين.",
        tr: "Mersin’de sertifikalı altın, külçe ve gümüş ticareti için kuyumcu vitrin sitesi.",
      },
    },
    {
      slug: "aramko-spedition",
      categorySlug: "design",
      imageSrc: "/assets/images/projects/aramko.jpg",
      externalUrl: "https://aramko-speditionmontage.de",
      sort: 4,
      name: {
        en: "Aramko Spedition",
        ar: "أرامكو سبيديشن",
        tr: "Aramko Spedition",
      },
      description: {
        en: "Brand and web presence for transport, delivery, and assembly services in Stuttgart.",
        ar: "هوية وحضور ويب لخدمات النقل والتوصيل والتركيب في شتوتغارت.",
        tr: "Stuttgart’ta taşımacılık, teslimat ve montaj hizmetleri için marka ve web görünümü.",
      },
    },
  ];

  const categorySlugs = categories.map((c) => c.slug);
  const projectSlugs = projects.map((p) => p.slug);

  await prismaClient.project.deleteMany({
    where: { slug: { notIn: projectSlugs } },
  });
  await prismaClient.projectCategory.deleteMany({
    where: { slug: { notIn: categorySlugs } },
  });

  const categoryBySlug = {};
  for (const cat of categories) {
    const row = await prismaClient.projectCategory.upsert({
      where: { slug: cat.slug },
      update: {
        icon: cat.icon,
        sort: cat.sort,
        status: true,
        imageSrc: null,
      },
      create: {
        slug: cat.slug,
        icon: cat.icon,
        sort: cat.sort,
        status: true,
        imageSrc: null,
      },
    });
    categoryBySlug[cat.slug] = row;

    for (const locale of LOCALES) {
      const fields = [
        { field: "name", value: cat.name[locale] },
        { field: "description", value: cat.description[locale] },
      ];
      for (const f of fields) {
        await prismaClient.projectCategoryTranslation.upsert({
          where: {
            projectCategoryId_locale_field: {
              projectCategoryId: row.id,
              locale,
              field: f.field,
            },
          },
          update: { value: f.value, status: true },
          create: {
            projectCategoryId: row.id,
            locale,
            field: f.field,
            value: f.value,
            status: true,
          },
        });
      }
    }
  }

  for (const item of projects) {
    const category = categoryBySlug[item.categorySlug];
    if (!category) {
      throw new Error(`Unknown categorySlug: ${item.categorySlug}`);
    }

    const project = await prismaClient.project.upsert({
      where: { slug: item.slug },
      update: {
        projectCategoryId: category.id,
        imageSrc: item.imageSrc,
        externalUrl: item.externalUrl,
        sort: item.sort,
        status: true,
        icon: null,
      },
      create: {
        slug: item.slug,
        projectCategoryId: category.id,
        imageSrc: item.imageSrc,
        externalUrl: item.externalUrl,
        sort: item.sort,
        status: true,
        icon: null,
      },
    });

    for (const locale of LOCALES) {
      const fields = [
        { field: "name", value: item.name[locale] },
        { field: "description", value: item.description[locale] },
      ];
      for (const f of fields) {
        await prismaClient.projectTranslation.upsert({
          where: {
            projectId_locale_field: {
              projectId: project.id,
              locale,
              field: f.field,
            },
          },
          update: { value: f.value, status: true },
          create: {
            projectId: project.id,
            locale,
            field: f.field,
            value: f.value,
            status: true,
          },
        });
      }
    }
  }

  console.log(
    `Seeded ${categories.length} project categories and ${projects.length} Asas Soft projects`,
  );
}

async function seedReferenceLogos(prismaClient) {
  const logos = [
    {
      name: "Layers",
      url: null,
      imageSrc: "/assets/images/partners/layers.svg",
      alt: "Layers logo",
      sort: 1,
    },
    {
      name: "Quotient",
      url: null,
      imageSrc: "/assets/images/partners/quotient.svg",
      alt: "Quotient logo",
      sort: 2,
    },
    {
      name: "Sisyphus",
      url: null,
      imageSrc: "/assets/images/partners/sisyphus.svg",
      alt: "Sisyphus logo",
      sort: 3,
    },
    {
      name: "Capsule",
      url: null,
      imageSrc: "/assets/images/partners/capsule.svg",
      alt: "Capsule logo",
      sort: 4,
    },
    {
      name: "Catalog",
      url: null,
      imageSrc: "/assets/images/partners/catalog.svg",
      alt: "Catalog logo",
      sort: 5,
    },
    {
      name: "Command+R",
      url: null,
      imageSrc: "/assets/images/partners/command-r.svg",
      alt: "Command+R logo",
      sort: 6,
    },
    {
      name: "GlobalBank",
      url: null,
      imageSrc: "/assets/images/partners/globalbank.svg",
      alt: "GlobalBank logo",
      sort: 7,
    },
    {
      name: "Hourglass",
      url: null,
      imageSrc: "/assets/images/partners/hourglass.svg",
      alt: "Hourglass logo",
      sort: 8,
    },
  ];

  const keepIds = [];
  for (let i = 0; i < logos.length; i++) {
    const row = logos[i];
    const id = i + 1;
    keepIds.push(id);
    await prismaClient.referenceLogo.upsert({
      where: { id },
      update: {
        name: row.name,
        url: row.url,
        imageSrc: row.imageSrc,
        alt: row.alt,
        sort: row.sort,
        status: true,
      },
      create: {
        id,
        name: row.name,
        url: row.url,
        imageSrc: row.imageSrc,
        alt: row.alt,
        sort: row.sort,
        status: true,
      },
    });
  }

  await prismaClient.referenceLogo.deleteMany({
    where: { id: { notIn: keepIds } },
  });

  console.log(`Seeded ${logos.length} reference logos`);
}

async function seedAdminUser(prismaClient) {
  const hashedPassword = await bcrypt.hash("admin123", 10);
  const adminUser = await prismaClient.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      passwordHash: hashedPassword,
      status: true,
      sort: 0,
    },
  });
  console.log("Created admin user:", adminUser.username);
}

async function main() {
  console.log("Starting seed...");
  await seedAdminUser(prisma);
  await seedAsasProjects(prisma);
  await seedReferenceLogos(prisma);
  await seedAsasServices(prisma);
  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
