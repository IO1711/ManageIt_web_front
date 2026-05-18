export function detectBrowserMetadata(navigatorLike) {
  const navigatorRef = navigatorLike ?? window.navigator;
  const userAgent = navigatorRef.userAgent ?? "";
  const platformHint = navigatorRef.userAgentData?.platform ?? navigatorRef.platform ?? "";
  const brands = Array.isArray(navigatorRef.userAgentData?.brands)
    ? navigatorRef.userAgentData.brands
    : [];

  const platform = detectPlatform(userAgent, platformHint);
  const browser = detectBrowser(userAgent, brands);

  return {
    suggestedName: buildSuggestedName(platform.platformName, browser.browserName),
    platformName: platform.platformName,
    platformVersion: platform.platformVersion,
    browserName: browser.browserName,
    browserVersion: browser.browserVersion
  };
}

function detectPlatform(userAgent, platformHint) {
  const normalizedPlatformHint = (platformHint || "").trim();

  if (/iPhone|iPad|iPod/i.test(userAgent)) {
    return {
      platformName: "iOS",
      platformVersion: extractVersion(userAgent, /(?:OS|CPU OS) ([\d_]+)/i, "_")
    };
  }

  if (/Android/i.test(userAgent)) {
    return {
      platformName: "Android",
      platformVersion: extractVersion(userAgent, /Android ([\d.]+)/i)
    };
  }

  if (/Mac OS X/i.test(userAgent) || /mac/i.test(normalizedPlatformHint)) {
    return {
      platformName: "macOS",
      platformVersion: extractVersion(userAgent, /Mac OS X ([\d_]+)/i, "_")
    };
  }

  if (/Windows/i.test(userAgent) || /win/i.test(normalizedPlatformHint)) {
    return {
      platformName: "Windows",
      platformVersion: extractVersion(userAgent, /Windows NT ([\d.]+)/i)
    };
  }

  if (/Linux/i.test(userAgent) || /linux/i.test(normalizedPlatformHint)) {
    return {
      platformName: "Linux",
      platformVersion: "Unknown"
    };
  }

  if (normalizedPlatformHint) {
    return {
      platformName: normalizedPlatformHint,
      platformVersion: "Unknown"
    };
  }

  return {
    platformName: "Unknown Platform",
    platformVersion: "Unknown"
  };
}

function detectBrowser(userAgent, brands) {
  const preferredBrand = pickPreferredBrand(brands);
  if (preferredBrand) {
    return preferredBrand;
  }

  if (/Edg\/([\d.]+)/.test(userAgent)) {
    return {
      browserName: "Edge",
      browserVersion: extractVersion(userAgent, /Edg\/([\d.]+)/)
    };
  }

  if (/Firefox\/([\d.]+)/.test(userAgent)) {
    return {
      browserName: "Firefox",
      browserVersion: extractVersion(userAgent, /Firefox\/([\d.]+)/)
    };
  }

  if (/Chrome\/([\d.]+)/.test(userAgent) && !/Edg\//.test(userAgent)) {
    return {
      browserName: "Chrome",
      browserVersion: extractVersion(userAgent, /Chrome\/([\d.]+)/)
    };
  }

  if (/Version\/([\d.]+).*Safari/.test(userAgent)) {
    return {
      browserName: "Safari",
      browserVersion: extractVersion(userAgent, /Version\/([\d.]+)/)
    };
  }

  return {
    browserName: "Unknown Browser",
    browserVersion: "Unknown"
  };
}

function pickPreferredBrand(brands) {
  const orderedNames = ["Microsoft Edge", "Google Chrome", "Chromium", "Firefox", "Safari"];

  for (const name of orderedNames) {
    const brand = brands.find((item) => item.brand === name);
    if (!brand) {
      continue;
    }

    return {
      browserName: normalizeBrandName(brand.brand),
      browserVersion: brand.version || "Unknown"
    };
  }

  const firstRealBrand = brands.find((item) => item.brand && item.brand !== "Not(A:Brand");

  if (!firstRealBrand) {
    return null;
  }

  return {
    browserName: normalizeBrandName(firstRealBrand.brand),
    browserVersion: firstRealBrand.version || "Unknown"
  };
}

function normalizeBrandName(brandName) {
  if (brandName === "Google Chrome") {
    return "Chrome";
  }

  if (brandName === "Microsoft Edge") {
    return "Edge";
  }

  return brandName;
}

function buildSuggestedName(platformName, browserName) {
  if (platformName.startsWith("Unknown") && browserName.startsWith("Unknown")) {
    return "Museum Browser";
  }

  if (platformName.startsWith("Unknown")) {
    return browserName;
  }

  if (browserName.startsWith("Unknown")) {
    return platformName;
  }

  return `${platformName} ${browserName}`;
}

function extractVersion(source, pattern, replaceCharacter) {
  const match = source.match(pattern);
  if (!match?.[1]) {
    return "Unknown";
  }

  if (!replaceCharacter) {
    return match[1];
  }

  return match[1].replaceAll(replaceCharacter, ".");
}
