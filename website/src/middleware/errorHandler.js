/**
 * Global error handler middleware
 */

import { company } from "../config/site.js";
import { generateSEOTags } from "../utils/seo.js";

const asasNotFoundLocals = (req) => {
  const locale = req.language || "en";
  return {
    bodyClass: "about-page legal-page not-found-page",
    extraCss: ["about.css", "legal.css"],
    extraJs: ["about-page.js"],
    asasContactModal: true,
    asasLangBase: "/",
    locale,
    seoData: generateSEOTags({
      title: `404 | ${company.name || "Asas Soft"}`,
      description: "Page not found",
      url: "/",
      locale,
      robots: "noindex, follow",
    }),
  };
};

export const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  // Prisma errors
  if (err.code === "P2002") {
    return res.status(409).json({
      error: "Duplicate entry",
      message: "A record with this value already exists",
    });
  }

  if (err.code === "P2025") {
    return res.status(404).json({
      error: "Not found",
      message: "Record not found",
    });
  }

  // Multer file size limit (e.g. image max 2 MB)
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      error: "File too large",
      message: "Image size must not exceed 2 MB",
    });
  }

  // Validation errors
  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: "Validation error",
      message: err.message,
    });
  }

  // Rate limit (429) – ensure JSON for API
  if (err.status === 429 || err.statusCode === 429) {
    if (req.path.startsWith("/api")) {
      return res.status(429).json({
        error: "Too many requests",
        message: err.message || "Too many requests, please try again later.",
      });
    }
    return res.status(429).render("pages/404", {
      ...asasNotFoundLocals(req),
      error: err.message || "Too many requests.",
    });
  }

  // Default error
  const status = err.status || err.statusCode || 500;
  const message =
    status < 500 || process.env.NODE_ENV !== "production"
      ? err.message || "Error"
      : "Internal server error";

  // For web routes, render error page
  if (!req.path.startsWith("/api")) {
    return res.status(status).render("pages/404", {
      ...asasNotFoundLocals(req),
      error: message,
    });
  }

  // For API routes, return JSON
  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

/**
 * 404 handler
 */
export const notFoundHandler = (req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ error: "Not Found" });
  }

  res.status(404).render("pages/404", asasNotFoundLocals(req));
};
