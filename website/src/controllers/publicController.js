import { company } from "../config/site.js";
import { serviceService } from "../services/serviceService.js";
import { projectService } from "../services/projectService.js";
import { referenceLogoService } from "../services/referenceLogoService.js";
import { generateSEOTags, generateStructuredData } from "../utils/seo.js";
import { projectCategoryService } from "../services/projectCategoryService.js";

/** Home Vision card slots (max 4). Assigned by sort among showOnHome services. */
const VISION_CARD_SLOTS = [
  {
    cardClass: "vision-card--tl",
    connector: "left",
    iconHref: "#icon-code",
  },
  {
    cardClass: "vision-card--tr",
    connector: "right",
    iconHref: "#icon-database",
  },
  {
    cardClass: "vision-card--bl",
    connector: "left",
    iconHref: "#icon-smartphone",
  },
  {
    cardClass: "vision-card--br",
    connector: "right",
    iconHref: "#icon-layout",
  },
];

const asasPage = (opts) => ({
  activeNav: opts.activeNav,
  bodyClass: opts.bodyClass || "",
  extraCss: opts.extraCss || [],
  extraJs: opts.extraJs || [],
  asasHome: Boolean(opts.asasHome),
  asasContactModal: Boolean(opts.asasContactModal),
  asasServicesModals: Boolean(opts.asasServicesModals),
  asasLangBase: opts.asasLangBase || "/",
});

const asasLegal = (langBase = "/") =>
  asasPage({
    bodyClass: "about-page legal-page",
    extraCss: ["about.css", "legal.css"],
    extraJs: ["about-page.js"],
    asasContactModal: true,
    asasLangBase: langBase,
  });

const asasNotFound = (locale) => ({
  ...asasPage({
    bodyClass: "about-page legal-page not-found-page",
    extraCss: ["about.css", "legal.css"],
    extraJs: ["about-page.js"],
    asasContactModal: true,
    asasLangBase: "/",
  }),
  locale: locale || "en",
  seoData: generateSEOTags({
    title: `404 | ${company.name}`,
    description: "Page not found",
    url: "/",
    locale: locale || "en",
    robots: "noindex, follow",
  }),
});

export const publicController = {
  async home(req, res, next) {
    try {
      const locale = req.language || "en";
      const seoData = generateSEOTags(
        {
          description: req.t("pageSeo.home.description"),
          keywords: req.t("pageSeo.home.keywords"),
          url: "/",
          locale,
        },
        res.locals.seo,
      );
      const structuredData = generateStructuredData();
      const services = await serviceService.list(locale, {
        status: true,
        showOnHome: true,
        limit: 4,
      });
      const visionServices = services.map((service, index) => ({
        ...VISION_CARD_SLOTS[index],
        service,
      }));
      const projects = await projectService.list(locale, {
        status: true,
        isFeatured: true,
      });

      res.render("pages/home", {
        ...asasPage({
          activeNav: "home",
          asasHome: true,
          asasLangBase: "/",
        }),
        locale,
        projects,
        seoData,
        structuredDataObj: structuredData,
        visionServices,
      });
    } catch (error) {
      next(error);
    }
  },

  async about(req, res, next) {
    try {
      const locale = req.language || "en";
      const seoData = generateSEOTags(
        {
          title: `${req.t("about.pageTitle")} | ${company.name}`,
          description: req.t("pageSeo.about.description"),
          keywords: req.t("pageSeo.about.keywords"),
          url: "/about",
          locale,
        },
        res.locals.seo,
      );
      const referenceLogos = await referenceLogoService.list({ status: true });
      res.render("pages/about", {
        ...asasPage({
          activeNav: "about",
          bodyClass: "about-page",
          extraCss: ["about.css"],
          extraJs: ["about-page.js"],
          asasContactModal: true,
          asasLangBase: "/about",
        }),
        locale,
        seoData,
        structuredDataObj: generateStructuredData(),
        referenceLogos,
      });
    } catch (error) {
      next(error);
    }
  },

  async services(req, res, next) {
    try {
      const locale = req.language || "en";
      const seoData = generateSEOTags(
        {
          title: `${req.t("services.pageTitle")} | ${company.name}`,
          description: req.t("pageSeo.services.description"),
          keywords: req.t("pageSeo.services.keywords"),
          url: "/services",
          locale,
        },
        res.locals.seo,
      );
      const services = await serviceService.list(locale, { status: true });
      res.render("pages/services", {
        ...asasPage({
          activeNav: "services",
          bodyClass: "services-page",
          extraCss: ["about.css", "services.css"],
          extraJs: ["services-page.js"],
          asasServicesModals: true,
          asasLangBase: "/services",
        }),
        locale,
        seoData,
        structuredDataObj: generateStructuredData(),
        services,
      });
    } catch (error) {
      next(error);
    }
  },

  async serviceDetail(req, res, next) {
    try {
      const { slug } = req.params;
      const locale = req.language || "en";
      const service = await serviceService.findBySlug(slug, locale);
      if (!service) {
        return res.status(404).render("pages/404", asasNotFound(locale));
      }
      const seoData = generateSEOTags(
        {
          title: `${req.t("services.pageTitle")} | ${company.name}`,
          description: req.t("pageSeo.services.description"),
          keywords: req.t("pageSeo.services.keywords"),
          url: `/services/${service.slug}`,
          locale,
        },
        res.locals.seo,
      );
      const services = await serviceService.list(locale, { status: true });
      res.render("pages/services", {
        ...asasPage({
          activeNav: "services",
          bodyClass: "services-page",
          extraCss: ["about.css", "services.css"],
          extraJs: ["services-page.js"],
          asasServicesModals: true,
          asasLangBase: "/services",
        }),
        locale,
        seoData,
        structuredDataObj: generateStructuredData(),
        services,
        focusSlug: service.slug,
      });
    } catch (error) {
      next(error);
    }
  },

  async projects(req, res, next) {
    try {
      const locale = req.language || "en";
      const seoData = generateSEOTags(
        {
          title: `${req.t("projects.pageTitle")} | ${company.name}`,
          description: req.t("pageSeo.projects.description"),
          keywords: req.t("pageSeo.projects.keywords"),
          url: "/projects",
          locale,
        },
        res.locals.seo,
      );
      const projects = await projectService.list(locale, {
        status: true,
      });
      const projectsCategories = await projectCategoryService.list(locale, {
        status: true,
      });
      res.render("pages/projects", {
        ...asasPage({
          activeNav: "projects",
          bodyClass: "projects-page about-page",
          extraCss: ["about.css", "projects.css"],
          extraJs: ["projects-page.js"],
          asasLangBase: "/projects",
        }),
        locale,
        projects,
        projectsCategories,
        seoData,
        structuredDataObj: generateStructuredData(),
      });
    } catch (error) {
      next(error);
    }
  },

  async contact(req, res, next) {
    try {
      const locale = req.language || "en";
      const seoData = generateSEOTags(
        {
          title: `${req.t("contact.pageTitle")} | ${company.name}`,
          description: req.t("pageSeo.contact.description"),
          keywords: req.t("pageSeo.contact.keywords"),
          url: "/contact",
          locale,
        },
        res.locals.seo,
      );
      res.render("pages/contact", {
        ...asasPage({
          activeNav: "contact",
          bodyClass: "contact-page",
          extraCss: ["about.css", "contact.css"],
          extraJs: ["contact-page.js"],
          asasLangBase: "/contact",
        }),
        locale,
        seoData,
        structuredDataObj: generateStructuredData(),
      });
    } catch (error) {
      next(error);
    }
  },

  async linktree(req, res, next) {
    try {
      const locale = req.language || "en";
      const seoData = generateSEOTags(
        {
          title: `${company.name} | Links`,
          description: company.tagline,
          url: "/linktree",
          locale,
        },
        res.locals.seo,
      );
      res.render("pages/linktree", { layout: false, locale, seoData });
    } catch (error) {
      next(error);
    }
  },

  async terms(req, res, next) {
    try {
      const locale = req.language || "en";
      const seoData = generateSEOTags({
        title: `${req.t("terms.pageTitle")} | ${company.name}`,
        description: req.t("pageSeo.terms.description"),
        keywords: req.t("pageSeo.terms.keywords"),
        url: "/terms",
        locale,
      });
      res.render("pages/terms", {
        ...asasLegal("/terms"),
        locale,
        seoData,
      });
    } catch (error) {
      next(error);
    }
  },

  async privacy(req, res, next) {
    try {
      const locale = req.language || "en";
      const seoData = generateSEOTags({
        title: `${req.t("privacy.pageTitle")} | ${company.name}`,
        description: req.t("pageSeo.privacy.description"),
        keywords: req.t("pageSeo.privacy.keywords"),
        url: "/privacy",
        locale,
      });
      res.render("pages/privacy", {
        ...asasLegal("/privacy"),
        locale,
        seoData,
      });
    } catch (error) {
      next(error);
    }
  },
};
