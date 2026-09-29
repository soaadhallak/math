(function () {
  "use strict";
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function getCurrentLanguage() {
    const lang = (document.documentElement.lang || "en")
      .split("-")[0]
      .toLowerCase();

    return ["en", "ar", "tr"].includes(lang) ? lang : "en";
  }

  const serviceMap = {
    web: "Web Development",
    ai: "AI Solutions",
    smarthome: "Smart Home",
    cloud: "Cloud Services",
    security: "Cybersecurity",
  };

  const testimonials = {
    en: [
      {
        name: "Lina Karim",
        when: "3 weeks ago",
        text: "Asas Soft rebuilt our stock panel and cut manual checks by about 11 hours per week.",
        avatar:
          "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&crop=face",
      },
      {
        name: "Omar Haddad",
        when: "5 weeks ago",
        text: "Drivers now get route updates in under 3 seconds instead of 12 after the dispatch migration.",
        avatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
      },
      {
        name: "Sara Nasser",
        when: "2 weeks ago",
        text: "Clients set up smart home scenes without calling our support line during showroom visits.",
        avatar:
          "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face",
      },
      {
        name: "Khalid Mansour",
        when: "6 weeks ago",
        text: "The security review came back with 14 items. Asas Soft closed the critical ones before our launch date.",
        avatar:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face",
      },
      {
        name: "Rana Saleh",
        when: "4 weeks ago",
        text: "Our store page speed score went from 58 to 91, and cart abandonment dropped in the first month.",
        avatar:
          "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&crop=face",
      },
      {
        name: "Yusuf Demir",
        when: "7 weeks ago",
        text: "The chatbot answers order status questions from our docs. Staff only step in for account changes.",
        avatar:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face",
      },
      {
        name: "Nadia Farouk",
        when: "1 week ago",
        text: "The new reservation flow syncs with our calendar and sends SMS reminders without manual follow-up.",
        avatar:
          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face",
      },
      {
        name: "Elias Khoury",
        when: "8 weeks ago",
        text: "Technicians log visits without signal and data syncs when they return to the depot Wi-Fi.",
        avatar:
          "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=80&h=80&fit=crop&crop=face",
      },
      {
        name: "Maha Awad",
        when: "3 weeks ago",
        text: "Orders from the web store now land in our ERP with stock levels matched across two warehouses.",
        avatar:
          "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=80&h=80&fit=crop&crop=face",
      },
      {
        name: "Tarek Suleiman",
        when: "5 weeks ago",
        text: "The monitoring dashboard ties door sensors and CCTV feeds into one view for our night shift.",
        avatar:
          "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&h=80&fit=crop&crop=face",
      },
      {
        name: "Hala Issa",
        when: "2 weeks ago",
        text: "The marketing site rewrite cut bounce rate on service pages from 71% to 49% in six weeks.",
        avatar:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face",
      },
      {
        name: "Fadi Najjar",
        when: "4 weeks ago",
        text: "Asas Soft rebuilt our partner API with rate limits, logs, and docs our integrators could test in a sandbox.",
        avatar:
          "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&crop=face",
      },
      {
        name: "Dina Khoury",
        when: "6 weeks ago",
        text: "Warehouse staff pick orders with handheld scanners tied to live stock counts on the floor.",
        avatar:
          "https://images.unsplash.com/photo-1582618771065-228002e66091?w=80&h=80&fit=crop&crop=face",
      },
      {
        name: "Samir Aziz",
        when: "9 weeks ago",
        text: "The checkout retry logic and local card gateway cut failed transactions during peak sales.",
        avatar:
          "https://images.unsplash.com/photo-1463453091185-98ceaa096bb5?w=80&h=80&fit=crop&crop=face",
      },
      {
        name: "Layla Haddad",
        when: "3 weeks ago",
        text: "Patients book follow-ups online and get SMS confirmations in Arabic and English.",
        avatar:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=face",
      },
      {
        name: "Karim Boutros",
        when: "10 weeks ago",
        text: "Encrypted snapshots run to cloud storage with a restore test logged every month.",
        avatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
      },
    ],
    ar: [
      {
        name: "لينا كريم",
        when: "منذ 3 أسابيع",
        text: "أعاد Asas Soft بناء لوحة المخزون ووفّر نحو 11 ساعة أسبوعياً من الفحص اليدوي.",
        avatar:
          "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&crop=face",
      },
      {
        name: "عمر حداد",
        when: "منذ 5 أسابيع",
        text: "السائقون يستلمون تحديثات المسار خلال 3 ثوانٍ بدل 12 بعد رفع نظام التوزيع.",
        avatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
      },
      {
        name: "سارة ناصر",
        when: "منذ أسبوعين",
        text: "العملاء يضبطون مشاهد البيت الذكي دون الاتصال بخط الدعم أثناء جولات العرض.",
        avatar:
          "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face",
      },
      {
        name: "خالد منصور",
        when: "منذ 6 أسابيع",
        text: "عادت مراجعة الأمن بـ 14 نقطة. أغلق Asas Soft النقاط الحرجة قبل موعد الإطلاق.",
        avatar:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face",
      },
      {
        name: "رنا صالح",
        when: "منذ 4 أسابيع",
        text: "ارتفعت سرعة المتجر من 58 إلى 91، وانخفضت نسبة ترك السلة في الشهر الأول.",
        avatar:
          "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&crop=face",
      },
      {
        name: "يوسف دمير",
        when: "منذ 7 أسابيع",
        text: "الروبوت يجيب عن حالة الطلب من وثائقنا. الموظفون يتدخلون فقط لتغييرات الحساب.",
        avatar:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face",
      },
      {
        name: "نادية فاروق",
        when: "منذ أسبوع",
        text: "مسار الحجز الجديد يربط التقويم ويرسل تذكيرات SMS دون متابعة يدوية.",
        avatar:
          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face",
      },
      {
        name: "إلياس خوري",
        when: "منذ 8 أسابيع",
        text: "الفنيون يسجلون الزيارات بلا إشارة وتتزامن البيانات عند العودة لشبكة المستودع.",
        avatar:
          "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=80&h=80&fit=crop&crop=face",
      },
      {
        name: "مها عوض",
        when: "منذ 3 أسابيع",
        text: "طلبات المتجر تصل إلى ERP مع مستويات مخزون متطابقة بين مستودعين.",
        avatar:
          "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=80&h=80&fit=crop&crop=face",
      },
      {
        name: "طارق سليمان",
        when: "منذ 5 أسابيع",
        text: "لوحة المراقبة تجمع حساسات الأبواب ومصادر الكاميرات في عرض واحد للوردية الليلية.",
        avatar:
          "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&h=80&fit=crop&crop=face",
      },
      {
        name: "هالة عيسى",
        when: "منذ أسبوعين",
        text: "إعادة بناء موقع التسويق خفّضت معدل الارتداد من 71% إلى 49% خلال ست أسابيع.",
        avatar:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face",
      },
      {
        name: "فادي نجار",
        when: "منذ 4 أسابيع",
        headline: "وقت تشغيل API 99.97%.",
        text: "أعاد Asas Soft بناء واجهة الشركاء مع حدود طلب وسجلات ووثائق للاختبار في sandbox.",
        avatar:
          "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&crop=face",
      },
      {
        name: "دينا خوري",
        when: "منذ 6 أسابيع",
        text: "موظفو المستودع يلتقطون الطلبات بماسحات مرتبطة بمخزون مباشر على الأرضية.",
        avatar:
          "https://images.unsplash.com/photo-1582618771065-228002e66091?w=80&h=80&fit=crop&crop=face",
      },
      {
        name: "سمير عزيز",
        when: "منذ 9 أسابيع",
        text: "منطق إعادة المحاولة وبوابة الدفع المحلية قلّصا المعاملات الفاشلة في ذروة المبيعات.",
        avatar:
          "https://images.unsplash.com/photo-1463453091185-98ceaa096bb5?w=80&h=80&fit=crop&crop=face",
      },
      {
        name: "ليلى حداد",
        when: "منذ 3 أسابيع",
        text: "المرضى يحجزون المتابعة على الموقع ويستلمون تأكيد SMS بالعربية والإنجليزية.",
        avatar:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=face",
      },
      {
        name: "كريم بطرس",
        when: "منذ 10 أسابيع",
        text: "لقطات مشفرة إلى السحابة مع اختبار استعادة موثق كل شهر.",
        avatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
      },
    ],
    tr: [
      {
        name: "Lina Karim",
        when: "3 hafta önce",
        text: "Asas Soft stok panelimizi yeniledi ve haftalık yaklaşık 11 saat manuel kontrolü azalttı.",
        avatar:
          "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&crop=face",
      },
      {
        name: "Omar Haddad",
        when: "5 hafta önce",
        text: "Sevk sistemi taşındıktan sonra sürücüler rota güncellemelerini 12 saniye yerine 3 saniyede alıyor.",
        avatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
      },
      {
        name: "Sara Nasser",
        when: "2 hafta önce",
        text: "Müşteriler showroom ziyaretlerinde destek hattını aramadan akıllı ev sahneleri kuruyor.",
        avatar:
          "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face",
      },
      {
        name: "Khalid Mansour",
        when: "6 hafta önce",
        text: "Güvenlik incelemesi 14 madde döndü. Asas Soft kritik olanları lansman tarihinden önce kapattı.",
        avatar:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face",
      },
      {
        name: "Rana Saleh",
        when: "4 hafta önce",
        headline: "Ödeme 1.2 saniyede yükleniyor.",
        text: "Mağaza hız puanımız 58'den 91'e çıktı, sepet terk oranı ilk ayda düştü.",
        avatar:
          "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&crop=face",
      },
      {
        name: "Yusuf Demir",
        when: "7 hafta önce",
        headline: "Destek biletleri %34 azaldı.",
        text: "Sohbet botu sipariş durumu sorularını belgelerimizden yanıtlıyor. Personel yalnızca hesap değişikliklerinde devreye giriyor.",
        avatar:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face",
      },
      {
        name: "Nadia Farouk",
        when: "1 hafta önce",
        text: "Yeni rezervasyon akışı takvimle senkronize oluyor ve SMS hatırlatmaları manuel takip gerektirmiyor.",
        avatar:
          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face",
      },
      {
        name: "Elias Khoury",
        when: "8 hafta önce",
        text: "Teknisyenler sinyal olmadan ziyaret kaydediyor, depo Wi-Fi'sine dönünce veri senkronize oluyor.",
        avatar:
          "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=80&h=80&fit=crop&crop=face",
      },
      {
        name: "Maha Awad",
        when: "3 hafta önce",
        text: "Web mağaza siparişleri iki depoda eşleşen stok seviyeleriyle ERP'ye düşüyor.",
        avatar:
          "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=80&h=80&fit=crop&crop=face",
      },
      {
        name: "Tarek Suleiman",
        when: "5 hafta önce",
        text: "İzleme panosu kapı sensörleri ve CCTV akışlarını gece vardiyası için tek ekranda topluyor.",
        avatar:
          "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&h=80&fit=crop&crop=face",
      },
      {
        name: "Hala Issa",
        when: "2 hafta önce",
        text: "Pazarlama sitesi yenilemesi hizmet sayfalarında hemen çıkma oranını altı haftada %71'den %49'a indirdi.",
        avatar:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face",
      },
      {
        name: "Fadi Najjar",
        when: "4 hafta önce",
        text: "Asas Soft ortak API'mizi limit, log ve sandbox test dokümanlarıyla yeniden kurdu.",
        avatar:
          "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&crop=face",
      },
      {
        name: "Dina Khoury",
        when: "6 hafta önce",
        text: "Depo personeli canlı stok sayılarına bağlı el terminalleriyle sipariş topluyor.",
        avatar:
          "https://images.unsplash.com/photo-1582618771065-228002e66091?w=80&h=80&fit=crop&crop=face",
      },
      {
        name: "Samir Aziz",
        when: "9 hafta önce",
        text: "Yeniden deneme mantığı ve yerel kart geçidi yoğun satış dönemindeki başarısız işlemleri azalttı.",
        avatar:
          "https://images.unsplash.com/photo-1463453091185-98ceaa096bb5?w=80&h=80&fit=crop&crop=face",
      },
      {
        name: "Layla Haddad",
        when: "3 hafta önce",
        text: "Hastalar takip randevusunu online alıyor ve Arapça ile İngilizce SMS onayı alıyor.",
        avatar:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=face",
      },
      {
        name: "Karim Boutros",
        when: "10 hafta önce",
        text: "Şifreli anlık görüntüler buluta gidiyor, her ay kayıtlı bir geri yükleme testi yapılıyor.",
        avatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
      },
    ],
  };

  const REVIEW_STORAGE_KEY = "asas-soft-reviews";

  function starMarkup(count) {
    const n = Math.max(1, Math.min(5, Number(count) || 5));

    return Array(n)
      .fill(
        '<svg class="services-testimonial-star" aria-hidden="true">' +
          '<use href="#icon-star"></use>' +
          "</svg>",
      )
      .join("");
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function loadStoredReviews() {
    try {
      const raw = localStorage.getItem(REVIEW_STORAGE_KEY);

      const list = raw ? JSON.parse(raw) : [];

      return Array.isArray(list) ? list : [];
    } catch (_) {
      return [];
    }
  }

  function saveStoredReviews(list) {
    try {
      localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(list));
    } catch (_) {}
  }

  function formatReviewWhen(iso, lang) {
    if (!iso) {
      return new Intl.RelativeTimeFormat(lang, { numeric: "auto" }).format(
        0,
        "day",
      );
    }

    const created = new Date(iso).getTime();

    if (Number.isNaN(created)) {
      return new Intl.RelativeTimeFormat(lang, { numeric: "auto" }).format(
        0,
        "day",
      );
    }

    const days = Math.max(0, Math.floor((Date.now() - created) / 86400000));

    if (days <= 0) {
      return new Intl.RelativeTimeFormat(lang, { numeric: "auto" }).format(
        0,
        "day",
      );
    }

    return new Intl.RelativeTimeFormat(lang, { numeric: "auto" }).format(
      -days,
      "day",
    );
  }

  function getApprovedReviewCards(lang) {
    return loadStoredReviews()
      .filter((item) => item && item.status === "approved" && item.text)
      .sort((a, b) =>
        String(b.createdAt || "").localeCompare(String(a.createdAt || "")),
      )
      .map((item) => ({
        name: item.name || "Client",

        when: formatReviewWhen(item.createdAt, lang),

        text: item.text,

        rating: item.rating || 5,
      }));
  }

  function getTestimonials(lang) {
    const base = testimonials[lang] || testimonials.en;

    const approved = getApprovedReviewCards(lang);

    return approved.concat(base);
  }

  function createTestimonialCard(item) {
    const rating = item.rating || 5;

    const article = document.createElement("article");

    article.className = "services-testimonial-card";

    article.innerHTML = `
      <header class="services-testimonial-card-head">

        <div class="services-testimonial-card-user">

          <svg
            class="services-testimonial-card-avatar"
            aria-hidden="true"
          >
            <use href="#icon-user"></use>
          </svg>

          <div>

            <p class="services-testimonial-card-name">
              ${escapeHtml(item.name)}
            </p>

            <p class="services-testimonial-card-when">
              ${escapeHtml(item.when)}
            </p>

          </div>

        </div>


        <div
          class="services-testimonial-card-stars"
          aria-label="${rating} / 5"
        >
          ${starMarkup(rating)}
        </div>

      </header>


      <p class="services-testimonial-card-text">
        ${escapeHtml(item.text)}
      </p>
    `;

    return article;
  }

  function fillTestimonialGroup(el, items) {
    if (!el) return;

    el.replaceChildren();

    items.forEach((item) => {
      el.appendChild(createTestimonialCard(item));
    });
  }

  const TESTIMONIALS_PER_ROW = 8;
  const TESTIMONIAL_SPEED_PX_S = 115;

  const testimonialMotion = {
    running: false,
    rafId: 0,
    lastTime: 0,
    speed: 0,

    top: {
      track: null,
      x: 0,
      groupWidth: 0,
      paused: false,
    },

    bottom: {
      track: null,
      x: 0,
      groupWidth: 0,
      paused: false,
    },
  };

  function isTestimonialsRtl() {
    return document.documentElement.dir === "rtl";
  }

  function measureTestimonialGroups() {
    const topGroup = $("#services-testimonials-group-top");

    const bottomGroup = $("#services-testimonials-group-bottom");

    testimonialMotion.top.groupWidth = topGroup?.offsetWidth || 0;

    testimonialMotion.bottom.groupWidth = bottomGroup?.offsetWidth || 0;

    testimonialMotion.speed = TESTIMONIAL_SPEED_PX_S / 1000;
  }

  function getInitialTestimonialOffset(direction) {
    const edge = window.innerWidth;
    const buffer = 24;
    const rtl = isTestimonialsRtl();

    const topWidth = testimonialMotion.top.groupWidth || edge;

    const bottomWidth = testimonialMotion.bottom.groupWidth || edge;

    if (direction === "top") {
      return rtl ? -(topWidth + buffer) : edge + buffer;
    }

    return rtl ? edge + buffer : -(bottomWidth + buffer);
  }

  function applyTestimonialTransform(state) {
    if (!state.track) return;

    state.track.style.transform = `translateX(${state.x}px)`;
  }

  function resetTestimonialCycleIfNeeded(state, direction) {
    const edge = window.innerWidth;
    const width = state.groupWidth;

    if (!width) return;

    const rtl = isTestimonialsRtl();

    if (direction === "top") {
      const exited = rtl ? state.x >= edge : state.x + width <= 0;

      if (exited) {
        state.x = getInitialTestimonialOffset("top");
      }

      return;
    }

    const exited = rtl ? state.x + width <= 0 : state.x >= edge;

    if (exited) {
      state.x = getInitialTestimonialOffset("bottom");
    }
  }

  function testimonialMotionTick(now) {
    if (!testimonialMotion.running) {
      return;
    }

    if (!testimonialMotion.lastTime) {
      testimonialMotion.lastTime = now;
    }

    const dt = Math.min(now - testimonialMotion.lastTime, 32);

    testimonialMotion.lastTime = now;

    if (dt > 0) {
      const step = testimonialMotion.speed * dt;

      const rtl = isTestimonialsRtl();

      if (!testimonialMotion.top.paused) {
        if (rtl) {
          testimonialMotion.top.x += step;
        } else {
          testimonialMotion.top.x -= step;
        }

        resetTestimonialCycleIfNeeded(testimonialMotion.top, "top");
      }

      if (!testimonialMotion.bottom.paused) {
        if (rtl) {
          testimonialMotion.bottom.x -= step;
        } else {
          testimonialMotion.bottom.x += step;
        }

        resetTestimonialCycleIfNeeded(testimonialMotion.bottom, "bottom");
      }
    }

    applyTestimonialTransform(testimonialMotion.top);

    applyTestimonialTransform(testimonialMotion.bottom);

    testimonialMotion.rafId = window.requestAnimationFrame(
      testimonialMotionTick,
    );
  }

  function stopTestimonialMotion() {
    testimonialMotion.running = false;
    testimonialMotion.lastTime = 0;

    if (testimonialMotion.rafId) {
      window.cancelAnimationFrame(testimonialMotion.rafId);

      testimonialMotion.rafId = 0;
    }
  }

  function startTestimonialMotion(resetPosition) {
    const section = $(".services-testimonials");

    if (!section) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      section.classList.add("is-active");

      return;
    }

    testimonialMotion.top.track = $(".services-testimonials-track--forward");

    testimonialMotion.bottom.track = $(".services-testimonials-track--reverse");

    measureTestimonialGroups();

    if (resetPosition) {
      testimonialMotion.top.x = getInitialTestimonialOffset("top");

      testimonialMotion.bottom.x = getInitialTestimonialOffset("bottom");
    }

    applyTestimonialTransform(testimonialMotion.top);

    applyTestimonialTransform(testimonialMotion.bottom);

    section.classList.add("is-active", "is-marquee-running");

    if (testimonialMotion.running) {
      return;
    }

    testimonialMotion.running = true;
    testimonialMotion.lastTime = 0;

    testimonialMotion.rafId = window.requestAnimationFrame(
      testimonialMotionTick,
    );
  }

  function activateTestimonialEntrance() {
    const section = $(".services-testimonials");

    if (!section || section.classList.contains("is-active")) {
      return;
    }

    startTestimonialMotion(true);
  }

  function observeTestimonialsSection() {
    const section = $(".services-testimonials");

    if (!section) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      section.classList.add("is-active");

      updateTestimonialsMotionPreference();

      return;
    }

    if (!("IntersectionObserver" in window)) {
      activateTestimonialEntrance();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          activateTestimonialEntrance();

          observer.disconnect();
        });
      },
      {
        threshold: 0.2,
        rootMargin: "0px 0px -8% 0px",
      },
    );

    observer.observe(section);
  }

  function updateTestimonialsMotionPreference() {
    const marquees = $(".services-testimonials-marquees");

    if (!marquees) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    marquees.setAttribute("aria-hidden", reduced ? "false" : "true");
  }

  function renderTestimonialMarquees(lang) {
    const items = getTestimonials(lang);

    const section = $(".services-testimonials");
    const wasActive = section?.classList.contains("is-active");
    const wasMarquee = section?.classList.contains("is-marquee-running");
    const topItems = items.slice(0, TESTIMONIALS_PER_ROW);

    let bottomItems = items.slice(
      TESTIMONIALS_PER_ROW,
      TESTIMONIALS_PER_ROW * 2,
    );

    if (!bottomItems.length) {
      bottomItems = topItems;
    }

    fillTestimonialGroup($("#services-testimonials-group-top"), topItems);

    fillTestimonialGroup($("#services-testimonials-group-bottom"), bottomItems);

    const a11y = $("#services-testimonials-a11y");

    if (a11y) {
      a11y.replaceChildren();

      items.forEach((item) => {
        const li = document.createElement("li");

        li.textContent = `${item.name}: ${item.text}`;

        a11y.appendChild(li);
      });
    }

    if (section) {
      if (wasMarquee || wasActive) {
        startTestimonialMotion(!wasMarquee);
      }
    }

    updateTestimonialsMotionPreference();
  }

  function initTestimonialsMarquee() {
    observeTestimonialsSection();

    const marquees = $(".services-testimonials-marquees");

    if (marquees && !marquees.dataset.pauseBound) {
      marquees.dataset.pauseBound = "1";

      const pauseRowForCard = (card, paused) => {
        if (!card) return;

        const rows = $$(".services-testimonials-row");

        if (rows[0]?.contains(card)) {
          testimonialMotion.top.paused = paused;
        }

        if (rows[1]?.contains(card)) {
          testimonialMotion.bottom.paused = paused;
        }
      };

      marquees.addEventListener("mouseover", (event) => {
        const card = event.target.closest?.(".services-testimonial-card");

        if (!card || !marquees.contains(card)) {
          return;
        }

        if (event.relatedTarget && card.contains(event.relatedTarget)) {
          return;
        }

        pauseRowForCard(card, true);
      });

      marquees.addEventListener("mouseout", (event) => {
        const card = event.target.closest?.(".services-testimonial-card");

        if (!card || !marquees.contains(card)) {
          return;
        }

        if (event.relatedTarget && card.contains(event.relatedTarget)) {
          return;
        }

        const next = event.relatedTarget?.closest?.(
          ".services-testimonial-card",
        );

        if (next && marquees.contains(next)) {
          const rows = $$(".services-testimonials-row");

          const sameTop = rows[0]?.contains(card) && rows[0]?.contains(next);

          const sameBottom = rows[1]?.contains(card) && rows[1]?.contains(next);

          if (sameTop || sameBottom) {
            return;
          }
        }

        pauseRowForCard(card, false);
      });
    }

    window.addEventListener("resize", () => {
      if (testimonialMotion.running) {
        measureTestimonialGroups();
      }
    });

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    motionQuery.addEventListener("change", () => {
      updateTestimonialsMotionPreference();

      const section = $(".services-testimonials");

      if (!section) return;

      if (motionQuery.matches) {
        stopTestimonialMotion();

        section.classList.add("is-active");

        section.classList.remove("is-marquee-running");
      }
    });
  }

  function closeMobileMenu() {
    if (window.AsasMobileNav) {
      window.AsasMobileNav.close();
    }
  }

  function toggleLangMenu() {
    const menu = $("#language-dropdown-menu");

    const trigger = $("#language-selector-trigger");

    if (!menu || !trigger) return;

    const open = menu.hidden;

    menu.hidden = !open;

    trigger.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function closeLangMenu() {
    const menu = $("#language-dropdown-menu");

    const trigger = $("#language-selector-trigger");

    if (!menu || !trigger) return;

    menu.hidden = true;

    trigger.setAttribute("aria-expanded", "false");
  }

  function openContact(serviceKey) {
    const modal = $("#contact-modal");

    const select = $("#contact-service");

    if (select && serviceKey && serviceMap[serviceKey]) {
      select.value = serviceMap[serviceKey];
    }

    showContactFormView();

    if (modal) {
      modal.hidden = false;

      document.body.classList.add("modal-open");
    }
  }

  function closeContact() {
    const modal = $("#contact-modal");

    if (!modal) return;

    modal.hidden = true;

    if (!isAnyModalOpen()) {
      document.body.classList.remove("modal-open");
    }
  }

  function isAnyModalOpen() {
    const contact = $("#contact-modal");

    const review = $("#review-modal");

    return (contact && !contact.hidden) || (review && !review.hidden);
  }

  function showContactSuccessView() {
    const formView = $("#contact-form-view");

    const successView = $("#contact-success-view");

    if (formView) {
      formView.hidden = true;
    }

    if (successView) {
      successView.hidden = false;
    }
  }

  function showContactFormView() {
    const formView = $("#contact-form-view");

    const successView = $("#contact-success-view");

    if (formView) {
      formView.hidden = false;
    }

    if (successView) {
      successView.hidden = true;
    }
  }

  function setReviewRating(value) {
    const rating = Math.max(1, Math.min(5, Number(value) || 5));

    const input = $("#review-rating");

    if (input) {
      input.value = String(rating);
    }

    $$(".services-review-star-btn").forEach((btn) => {
      const star = Number(btn.dataset.rating);

      const active = star <= rating;

      btn.classList.toggle("is-active", active);

      btn.setAttribute("aria-checked", star === rating ? "true" : "false");
    });
  }

  function showReviewFormView() {
    const formView = $("#review-form-view");

    const successView = $("#review-success-view");

    if (formView) {
      formView.hidden = false;
    }

    if (successView) {
      successView.hidden = true;
    }
  }

  function showReviewSuccessView() {
    const formView = $("#review-form-view");

    const successView = $("#review-success-view");

    if (formView) {
      formView.hidden = true;
    }

    if (successView) {
      successView.hidden = false;
    }
  }

  function openReview() {
    const modal = $("#review-modal");

    const form = $("#review-form");

    if (form) {
      form.reset();
    }

    setReviewRating(5);

    showReviewFormView();

    if (modal) {
      modal.hidden = false;

      document.body.classList.add("modal-open");
    }

    const nameInput = $("#review-name");

    if (nameInput) {
      nameInput.focus();
    }
  }

  function closeReview() {
    const modal = $("#review-modal");

    if (!modal) return;

    modal.hidden = true;

    if (!isAnyModalOpen()) {
      document.body.classList.remove("modal-open");
    }
  }

  function submitReview(event) {
    event.preventDefault();

    const name = ($("#review-name")?.value || "").trim();

    const company = ($("#review-company")?.value || "").trim();

    const text = ($("#review-text")?.value || "").trim();

    const rating = Number($("#review-rating")?.value || 5);

    if (!name || !text) {
      return;
    }

    const list = loadStoredReviews();

    list.unshift({
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `r-${Date.now()}`,

      name,

      company,

      text,

      rating: Math.max(1, Math.min(5, rating || 5)),

      status: "pending",

      createdAt: new Date().toISOString(),

      lang: getCurrentLanguage(),
    });

    saveStoredReviews(list);

    showReviewSuccessView();
  }

  /*
   * General actions
   */
  function handleAction(action, el) {
    if (action === "top") {
      const scroller = document.scrollingElement || document.documentElement;

      scroller.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    if (action === "contact") {
      openContact(el?.dataset?.service);

      return;
    }

    if (action === "review") {
      openReview();

      return;
    }

    if (action === "projects") {
      window.location.href = "/projects";
    }
  }

  document.addEventListener("click", (event) => {
    const socialEl = event.target.closest(".footer-social-link");

    if (
      socialEl &&
      (socialEl.getAttribute("href") === "#" || !socialEl.getAttribute("href"))
    ) {
      event.preventDefault();
    }

    const actionEl = event.target.closest("[data-action]");

    if (actionEl) {
      const action = actionEl.dataset.action;
      if (action === "projects") {
        // Normal browser navigation.
      } else {
        event.preventDefault();

        handleAction(action, actionEl);
      }

      if (actionEl.closest("#mobile-menu")) {
        closeMobileMenu();
      }
    }

    /*
     * Modal close buttons
     */
    const closeEl = event.target.closest("[data-close]");

    if (closeEl) {
      if (closeEl.dataset.close === "contact") {
        closeContact();
      }

      if (closeEl.dataset.close === "review") {
        closeReview();
      }
    }

    /*
     * Review rating
     */
    const reviewStar = event.target.closest(".services-review-star-btn");

    if (reviewStar && reviewStar.dataset.rating) {
      setReviewRating(reviewStar.dataset.rating);
    }

    const langOpt = event.target.closest(".lang-option, .mobile-lang-btn");

    if (langOpt) {
      closeLangMenu();
    }
  });

  const langTrigger = $("#language-selector-trigger");

  if (langTrigger) {
    langTrigger.addEventListener("click", (event) => {
      event.stopPropagation();

      toggleLangMenu();
    });
  }

  document.addEventListener("mousedown", (event) => {
    const dropdown = $("#lang-dropdown");

    if (dropdown && !dropdown.contains(event.target)) {
      closeLangMenu();
    }
  });

  const contactForm = $("#contact-form");

  if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();

      showContactSuccessView();
    });
  }

  const doneBtn = $("#contact-done-btn");

  if (doneBtn) {
    doneBtn.addEventListener("click", () => {
      showContactFormView();
      closeContact();
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !isAnyModalOpen()) {
      return;
    }

    const review = $("#review-modal");

    if (review && !review.hidden) {
      closeReview();
      return;
    }

    closeContact();
  });

  const modalOverlay = $("#contact-modal");

  if (modalOverlay) {
    modalOverlay.addEventListener("click", (event) => {
      if (event.target === modalOverlay) {
        closeContact();
      }
    });
  }

  const reviewOverlay = $("#review-modal");

  if (reviewOverlay) {
    reviewOverlay.addEventListener("click", (event) => {
      if (event.target === reviewOverlay) {
        closeReview();
      }
    });
  }

  const reviewForm = $("#review-form");

  if (reviewForm) {
    reviewForm.addEventListener("submit", submitReview);
  }

  const reviewDoneBtn = $("#review-done-btn");

  if (reviewDoneBtn) {
    reviewDoneBtn.addEventListener("click", () => {
      showReviewFormView();
      closeReview();
    });
  }

  function setAccordionIcon(trigger, expanded) {
    const icon = trigger.querySelector(".services-accordion-icon use");

    if (icon) {
      icon.setAttribute(
        "href",
        expanded ? "#icon-chevron-up" : "#icon-chevron-down",
      );
    }
  }

  function closeAccordionItem(item) {
    const trigger = item.querySelector(".services-accordion-trigger");

    const body = item.querySelector(".services-accordion-body");

    if (!trigger || !body) {
      return;
    }

    item.classList.remove("is-open");

    trigger.setAttribute("aria-expanded", "false");

    body.removeAttribute("hidden");

    setAccordionIcon(trigger, false);
  }

  function openAccordionItem(item) {
    const trigger = item.querySelector(".services-accordion-trigger");

    const body = item.querySelector(".services-accordion-body");

    if (!trigger || !body) {
      return;
    }

    item.classList.add("is-open");

    trigger.setAttribute("aria-expanded", "true");

    body.removeAttribute("hidden");

    setAccordionIcon(trigger, true);
  }

  function initServicesAccordion() {
    document.addEventListener("click", (event) => {
      const trigger = event.target.closest(".services-accordion-trigger");

      if (!trigger) return;

      const item = trigger.closest(".services-accordion-item");

      const accordion = trigger.closest(".services-accordion");

      if (!item || !accordion) {
        return;
      }

      const isOpen = item.classList.contains("is-open");

      $$(".services-accordion-item", accordion).forEach(closeAccordionItem);

      if (!isOpen) {
        openAccordionItem(item);
      }
    });
  }

  function initServicesReveals() {
    const nodes = $$(".services-reveal");

    if (!nodes.length) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      nodes.forEach((el) => el.classList.add("is-inview"));

      return;
    }

    if (!("IntersectionObserver" in window)) {
      nodes.forEach((el) => el.classList.add("is-inview"));

      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add("is-inview");

          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.18,
        rootMargin: "0px 0px -6% 0px",
      },
    );

    nodes.forEach((el) => observer.observe(el));
  }

  function scrollToServiceHash() {
    const main = document.getElementById("services-main");

    const fromData = main?.dataset?.focusSlug || "";

    const fromHash = (window.location.hash || "").replace(/^#/, "");

    const raw = fromData || fromHash;

    if (!raw) return;

    const el =
      document.getElementById(raw) || document.getElementById(`service-${raw}`);

    if (!el) return;

    if (fromData && !fromHash) {
      history.replaceState(null, "", `#${raw}`);
    }

    requestAnimationFrame(() => {
      el.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  initServicesAccordion();
  initTestimonialsMarquee();
  initServicesReveals();

  renderTestimonialMarquees(getCurrentLanguage());

  window.addEventListener("hashchange", scrollToServiceHash);

  window.addEventListener("load", scrollToServiceHash);

  scrollToServiceHash();
})();
