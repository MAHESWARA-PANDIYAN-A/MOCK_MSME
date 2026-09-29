export interface NICActivityItem {
  code: string;
  majorActivity: string;
  section: string;
  description: string;
}

export const NIC_ACTIVITIES: NICActivityItem[] = [
  {
    code: "DEMO-1071",
    majorActivity: "MANUFACTURING",
    section: "Food Processing",
    description: "Manufacture of bakery, sweets, confectionery and packaged snack foods"
  },
  {
    code: "DEMO-1079",
    majorActivity: "MANUFACTURING",
    section: "Food Processing",
    description: "Manufacture of other food products including spices, sauces, and edible oils"
  },
  {
    code: "DEMO-1312",
    majorActivity: "MANUFACTURING",
    section: "Textiles",
    description: "Weaving of textiles, fabrics, cotton yarns and garment manufacturing"
  },
  {
    code: "DEMO-2592",
    majorActivity: "MANUFACTURING",
    section: "Engineering & Machinery",
    description: "Machining, metal fabrication and precision industrial component manufacturing"
  },
  {
    code: "DEMO-2023",
    majorActivity: "MANUFACTURING",
    section: "Chemicals & Plastics",
    description: "Manufacture of soap, detergents, cleaning and polishing preparations"
  },
  {
    code: "DEMO-6201",
    majorActivity: "SERVICES",
    section: "Information Technology",
    description: "Computer programming, software development, web & cloud solutions"
  },
  {
    code: "DEMO-6202",
    majorActivity: "SERVICES",
    section: "Information Technology",
    description: "IT consultancy, systems architecture and technical support services"
  },
  {
    code: "DEMO-5210",
    majorActivity: "SERVICES",
    section: "Logistics & Transport",
    description: "Warehousing, cold storage and freight logistics operations"
  },
  {
    code: "DEMO-7020",
    majorActivity: "SERVICES",
    section: "Professional Services",
    description: "Management consultancy, accounting, auditing and business advisory"
  },
  {
    code: "DEMO-4630",
    majorActivity: "TRADING",
    section: "Wholesale Trade",
    description: "Wholesale of food, beverages, agricultural commodities and consumer goods"
  },
  {
    code: "DEMO-4752",
    majorActivity: "TRADING",
    section: "Retail Trade",
    description: "Retail sale of hardware, paints, glass, and electrical construction supplies"
  },
  {
    code: "DEMO-4791",
    majorActivity: "TRADING",
    section: "E-Commerce",
    description: "Retail sale via mail order houses or via Internet marketplace platforms"
  }
];
