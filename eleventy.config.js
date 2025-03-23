const { DateTime } = require("luxon");
const markdownItAnchor = require("markdown-it-anchor");

const pluginRss = require("@11ty/eleventy-plugin-rss");
const pluginSyntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const pluginBundle = require("@11ty/eleventy-plugin-bundle");
const pluginNavigation = require("@11ty/eleventy-navigation");
const { EleventyHtmlBasePlugin } = require("@11ty/eleventy");

const pluginDrafts = require("./eleventy.config.drafts.js");
const pluginImages = require("./eleventy.config.images.js");

module.exports = function(eleventyConfig) {
  // Passthrough copy for static files
  // Copies the contents of the `public` folder to the output folder
  // E.g., `./public/css/` ends up in `_site/css/`
  eleventyConfig.addPassthroughCopy({
    "./public/": "/",
    "./node_modules/prismjs/themes/prism-okaidia.css": "/css/prism-okaidia.css",
      "./admin/": "/admin/"
  });

  // Watch target for content images
  // Eleventy will re-run when these files change
  eleventyConfig.addWatchTarget("content/**/*.{svg,webp,png,jpeg}");

  // Add custom plugins
  eleventyConfig.addPlugin(pluginDrafts);
  eleventyConfig.addPlugin(pluginImages);

  // Add official Eleventy plugins
  eleventyConfig.addPlugin(pluginRss); // RSS feed plugin
  eleventyConfig.addPlugin(pluginSyntaxHighlight, {
    preAttributes: { tabindex: 0 } // Adds tabindex to pre elements for better accessibility
  });
  eleventyConfig.addPlugin(pluginNavigation); // Navigation plugin
  eleventyConfig.addPlugin(EleventyHtmlBasePlugin); // Base HTML plugin
  eleventyConfig.addPlugin(pluginBundle); // Bundle plugin

  // Add custom filters
  eleventyConfig.addFilter("readableDate", (dateObj, format, zone) => {
    // Converts a date object to a human-readable string
    // Formatting tokens: https://moment.github.io/luxon/#/formatting?id=table-of-tokens
    return DateTime.fromJSDate(dateObj, { zone: zone || "utc" }).toFormat(format || "dd LLLL yyyy");
  });

  eleventyConfig.addFilter('htmlDateString', (dateObj) => {
    // Converts a date object to an HTML date string (yyyy-LL-dd)
    return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toFormat('yyyy-LL-dd');
  });

  eleventyConfig.addFilter("head", (array, n) => {
    // Gets the first `n` elements of a collection
    if(!Array.isArray(array) || array.length === 0) {
      return [];
    }
    if( n < 0 ) {
      return array.slice(n);
    }
    return array.slice(0, n);
  });

  eleventyConfig.addFilter("min", (...numbers) => {
    // Returns the smallest number argument
    return Math.min.apply(null, numbers);
  });

  eleventyConfig.addFilter("getAllTags", collection => {
    // Returns all unique tags used in a collection
    let tagSet = new Set();
    for(let item of collection) {
      (item.data.tags || []).forEach(tag => tagSet.add(tag));
    }
    return Array.from(tagSet);
  });

  eleventyConfig.addFilter("filterTagList", function filterTagList(tags) {
    // Filters out unwanted tags
    return (tags || []).filter(tag => ["all", "nav", "post", "posts"].indexOf(tag) === -1);
  });

  // Customize Markdown library settings
  eleventyConfig.amendLibrary("md", mdLib => {
    mdLib.use(markdownItAnchor, {
      permalink: markdownItAnchor.permalink.ariaHidden({
        placement: "after",
        class: "header-anchor",
        symbol: "#",
        ariaHidden: false,
      }),
      level: [1,2,3,4],
      slugify: eleventyConfig.getFilter("slugify")
    });
  });

  // Add a shortcode to get the current build date
  eleventyConfig.addShortcode("currentBuildDate", () => {
    return (new Date()).toISOString();
  });

  return {
    // Template formats that Eleventy will process
    templateFormats: [
      "md",
      "njk",
      "html",
      "liquid",
    ],

    // Pre-process *.md files with Nunjucks (njk)
    markdownTemplateEngine: "njk",

    // Pre-process *.html files with Nunjucks (njk)
    htmlTemplateEngine: "njk",

    // Directory settings
    dir: {
      input: "content",          // Input directory (default: ".")
      includes: "../_includes",  // Includes directory (default: "_includes")
      data: "../_data",          // Data directory (default: "_data")
      output: "_site"            // Output directory (default: "_site")
    },

    // Optional items
    pathPrefix: "/", // Path prefix for deployment to a subdirectory
  };
};
