export interface BankInfo {
  name: string;
  logo: string;
  color: string;
}

export function detectBank(cardNumber: string): BankInfo {
  const bin = cardNumber.replace(/\s/g, "").substring(0, 6);
  
  // Visa bins
  if (bin.startsWith("4")) {
    return {
      name: "Visa",
      logo: "💳",
      color: "#1A1F71"
    };
  }
  
  // Mastercard bins
  if (bin >= "510000" && bin <= "559999") {
    return {
      name: "Mastercard",
      logo: "💳",
      color: "#EB001B"
    };
  }
  
  // American Express bins
  if (bin.startsWith("34") || bin.startsWith("37")) {
    return {
      name: "American Express",
      logo: "💳",
      color: "#006FCF"
    };
  }
  
  // Discover bins
  if (bin.startsWith("6011") || bin.startsWith("65")) {
    return {
      name: "Discover",
      logo: "💳",
      color: "#FF6000"
    };
  }
  
  // Popular French banks by BIN
  if (["497511", "497591", "497592"].includes(bin)) {
    return {
      name: "BNP Paribas",
      logo: "🏦",
      color: "#00915A"
    };
  }
  
  if (["450903", "450904", "486236"].includes(bin)) {
    return {
      name: "Crédit Agricole",
      logo: "🏦",
      color: "#00684A"
    };
  }
  
  if (["512871", "513457", "522371"].includes(bin)) {
    return {
      name: "Société Générale",
      logo: "🏦",
      color: "#E60028"
    };
  }
  
  if (["434533", "434534", "434535"].includes(bin)) {
    return {
      name: "Crédit Mutuel",
      logo: "🏦",
      color: "#003D6A"
    };
  }
  
  if (["425706", "425707", "453275"].includes(bin)) {
    return {
      name: "LCL",
      logo: "🏦",
      color: "#0066CC"
    };
  }
  
  if (["425790", "434769", "497878"].includes(bin)) {
    return {
      name: "Caisse d'Épargne",
      logo: "🏦",
      color: "#D8232A"
    };
  }
  
  if (["438602", "497592", "513457"].includes(bin)) {
    return {
      name: "La Banque Postale",
      logo: "🏦",
      color: "#FFCC00"
    };
  }
  
  if (["450875", "486236", "522371"].includes(bin)) {
    return {
      name: "Boursorama",
      logo: "🏦",
      color: "#F37021"
    };
  }
  
  // Default
  return {
    name: "Votre Banque",
    logo: "🏦",
    color: "#00684A"
  };
}
