import { PrismaClient, Role, CouponType, OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { saveProductSvgLocally } from "../src/lib/placeholder-svg";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting ShopNest Database Seed...");

  // 1. Clean existing records in reverse dependency order
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.returnRequest.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.couponRedemption.deleteMany();
  await prisma.order.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.review.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.address.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.emailVerificationToken.deleteMany();
  await prisma.idempotencyKey.deleteMany();
  await prisma.user.deleteMany();

  // 2. Seed Users
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@shopnest.in";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "AdminPassword123!";
  const customerEmail = process.env.SEED_CUSTOMER_EMAIL || "customer@shopnest.in";
  const customerPassword = process.env.SEED_CUSTOMER_PASSWORD || "CustomerPassword123!";

  const adminHash = await bcrypt.hash(adminPassword, 12);
  const customerHash = await bcrypt.hash(customerPassword, 12);

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      name: "ShopNest Administrator",
      passwordHash: adminHash,
      role: Role.ADMIN,
      phone: "+91 9876543210",
      emailVerified: new Date(),
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: customerEmail,
      name: "Rohan Sharma",
      passwordHash: customerHash,
      role: Role.CUSTOMER,
      phone: "+91 9123456780",
      emailVerified: new Date(),
      addresses: {
        create: [
          {
            fullName: "Rohan Sharma",
            phone: "9123456780",
            addressLine1: "Flat 402, Sunshine Heights, Andheri West",
            addressLine2: "Near Infinity Mall, Link Road",
            landmark: "Opposite Citi Mall",
            city: "Mumbai",
            state: "MH",
            postalCode: "400053",
            isDefault: true,
          },
          {
            fullName: "Rohan Sharma (Office)",
            phone: "9123456780",
            addressLine1: "Tech Park, Building 3B, 5th Floor",
            addressLine2: "Electronic City Phase 1",
            city: "Bengaluru",
            state: "KA",
            postalCode: "560100",
            isDefault: false,
          },
        ],
      },
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      email: "ananya.patel@shopnest.in",
      name: "Ananya Patel",
      passwordHash: customerHash,
      role: Role.CUSTOMER,
      phone: "+91 9876501234",
      emailVerified: new Date(),
    },
  });

  console.log(`👤 Created Admin (${admin.email}) and Customers (${customer.email}, ${customer2.email})`);

  // 3. Seed 9 Categories
  const categoriesData = [
    { name: "Mobiles & Accessories", slug: "mobiles", description: "Smartphones, earphones, cases, chargers & smartwatches" },
    { name: "Electronics & Computers", slug: "electronics", description: "Laptops, audio, monitors, storage & gaming accessories" },
    { name: "Fashion & Apparel", slug: "fashion", description: "Men's & Women's clothing, footwear, watches & ethnic wear" },
    { name: "Home & Kitchen", slug: "home-kitchen", description: "Cookware, bedsheets, decor, dining & smart home utilities" },
    { name: "Beauty & Personal Care", slug: "beauty", description: "Skincare, haircare, makeup, grooming & fragrances" },
    { name: "Major Appliances", slug: "appliances", description: "Refrigerators, washing machines, microwaves & ACs" },
    { name: "Books & Stationery", slug: "books", description: "Bestsellers, competitive exams, fiction & journals" },
    { name: "Grocery & Gourmet", slug: "grocery", description: "Indian spices, staples, dry fruits, snacks & tea/coffee" },
    { name: "Sports & Fitness", slug: "sports", description: "Yoga mats, gym equipment, sportswear & hydration" },
  ];

  const categories: Record<string, any> = {};
  for (const cat of categoriesData) {
    categories[cat.slug] = await prisma.category.create({
      data: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        image: `/images/categories/${cat.slug}.svg`,
      },
    });
  }
  console.log(`📁 Created ${Object.keys(categories).length} categories`);

  // 4. Seed 42 Realistic Products with Variants and Reviews
  interface SeedProductDef {
    name: string;
    slug: string;
    categorySlug: string;
    brand: string;
    description: string;
    basePrice: number; // in paise
    mrp: number;       // in paise
    gstRate: number;
    isFeatured?: boolean;
    variants: Array<{
      sku: string;
      name: string;
      price: number;
      mrp: number;
      stock: number;
      attributes: Record<string, string>;
    }>;
    reviews: Array<{
      rating: number;
      title: string;
      comment: string;
    }>;
  }

  const productsData: SeedProductDef[] = [
    // Mobiles (5)
    {
      name: "OnePlus Nord CE4 5G (Dark Chrome)",
      slug: "oneplus-nord-ce4-5g",
      categorySlug: "mobiles",
      brand: "OnePlus",
      description: "Qualcomm Snapdragon 7 Gen 3, 100W SUPERVOOC charging, 5500 mAh battery, and 50MP Sony LYT-600 Camera with OIS.",
      basePrice: 2499900,
      mrp: 2799900,
      gstRate: 18,
      isFeatured: true,
      variants: [
        { sku: "OP-CE4-8-128", name: "8GB RAM + 128GB Storage", price: 2499900, mrp: 2799900, stock: 45, attributes: { RAM: "8GB", Storage: "128GB", Color: "Dark Chrome" } },
        { sku: "OP-CE4-8-256", name: "8GB RAM + 256GB Storage", price: 2699900, mrp: 2999900, stock: 30, attributes: { RAM: "8GB", Storage: "256GB", Color: "Celadon Marble" } },
      ],
      reviews: [
        { rating: 5, title: "Superb battery and display", comment: "The 100W charging fills the 5500mAh battery in under 30 mins. Great value for Indian buyers." },
        { rating: 4, title: "Smooth UI, solid cameras", comment: "OxygenOS 14 is clean and snappy. Night camera shots are crisp." },
      ],
    },
    {
      name: "boAt Airdopes 141 ANC TWS Earbuds",
      slug: "boat-airdopes-141-anc",
      categorySlug: "mobiles",
      brand: "boAt",
      description: "Active Noise Cancellation up to 32dB, 42 hours playback time, ENx technology for crystal clear calls, and ASAP Charge.",
      basePrice: 149900,
      mrp: 599000,
      gstRate: 18,
      isFeatured: true,
      variants: [
        { sku: "BOAT-141-BLK", name: "Carbon Black", price: 149900, mrp: 599000, stock: 120, attributes: { Color: "Carbon Black" } },
        { sku: "BOAT-141-WHT", name: "Gunmetal White", price: 149900, mrp: 599000, stock: 85, attributes: { Color: "Gunmetal White" } },
      ],
      reviews: [
        { rating: 5, title: "Best bass in this budget", comment: "ANC works surprisingly well against fan noise. Battery lasts forever!" },
      ],
    },
    {
      name: "Samsung Galaxy M35 5G (Moonlight Blue)",
      slug: "samsung-galaxy-m35-5g",
      categorySlug: "mobiles",
      brand: "Samsung",
      description: "Monster 6000mAh battery, 120Hz sAMOLED display, 50MP No Shake Camera, Exynos 1380 processor with Vapor Cooling Chamber.",
      basePrice: 1999900,
      mrp: 2449900,
      gstRate: 18,
      variants: [
        { sku: "SAM-M35-6-128", name: "6GB + 128GB", price: 1999900, mrp: 2449900, stock: 50, attributes: { RAM: "6GB", Storage: "128GB" } },
        { sku: "SAM-M35-8-256", name: "8GB + 256GB", price: 2199900, mrp: 2649900, stock: 40, attributes: { RAM: "8GB", Storage: "256GB" } },
      ],
      reviews: [{ rating: 5, title: "Battery is an absolute beast", comment: "Easily gets 2 days of heavy usage with 5G on." }],
    },
    {
      name: "Noise ColorFit Pulse 3 Smart Watch",
      slug: "noise-colorfit-pulse-3",
      categorySlug: "mobiles",
      brand: "Noise",
      description: "1.96 inch TFT display, Bluetooth calling with Tru Sync, 100 sports modes, SpO2, heart rate and sleep tracking.",
      basePrice: 139900,
      mrp: 499900,
      gstRate: 18,
      variants: [
        { sku: "NOISE-P3-JET", name: "Jet Black", price: 139900, mrp: 499900, stock: 95, attributes: { Color: "Jet Black" } },
        { sku: "NOISE-P3-ROSE", name: "Rose Pink", price: 139900, mrp: 499900, stock: 60, attributes: { Color: "Rose Pink" } },
      ],
      reviews: [{ rating: 4, title: "Good screen and calling quality", comment: "Crisp speaker and mic for quick phone calls on the go." }],
    },
    {
      name: "Ambrane 20000mAh Power Bank 20W Fast Charging",
      slug: "ambrane-20000mah-power-bank",
      categorySlug: "mobiles",
      brand: "Ambrane",
      description: "Made in India, 20W Power Delivery & Quick Charge 3.0 output, Type-C input/output, Multi-layer chipset protection.",
      basePrice: 169900,
      mrp: 299900,
      gstRate: 18,
      variants: [
        { sku: "AMB-PB20-BLK", name: "Matte Black", price: 169900, mrp: 299900, stock: 150, attributes: { Capacity: "20000mAh" } },
      ],
      reviews: [{ rating: 5, title: "Reliable companion during travel", comment: "Charges my phone 4 times completely." }],
    },

    // Electronics & Computers (5)
    {
      name: "HP 15s 12th Gen Intel Core i5 Laptop",
      slug: "hp-15s-intel-core-i5",
      categorySlug: "electronics",
      brand: "HP",
      description: "12th Gen Intel Core i5-1235U, 16GB DDR4, 512GB SSD, 15.6-inch FHD Micro-Edge Anti-Glare, Windows 11 + MS Office 2021.",
      basePrice: 5199000,
      mrp: 6549000,
      gstRate: 18,
      isFeatured: true,
      variants: [
        { sku: "HP-15S-16-512", name: "16GB RAM / 512GB SSD", price: 5199000, mrp: 6549000, stock: 25, attributes: { RAM: "16GB", Storage: "512GB SSD" } },
      ],
      reviews: [{ rating: 5, title: "Fast and lightweight", comment: "Perfect for office multitasking and code compilation." }],
    },
    {
      name: "Logitech MX Master 3S Wireless Performance Mouse",
      slug: "logitech-mx-master-3s",
      categorySlug: "electronics",
      brand: "Logitech",
      description: "Quiet Clicks, 8K DPI any-surface tracking, MagSpeed electromagnetic scrolling, USB-C fast charging, Bluetooth & Bolt.",
      basePrice: 899500,
      mrp: 1099500,
      gstRate: 18,
      variants: [
        { sku: "LOGI-MX3S-GRY", name: "Pale Grey", price: 899500, mrp: 1099500, stock: 35, attributes: { Color: "Pale Grey" } },
        { sku: "LOGI-MX3S-BLK", name: "Graphite", price: 899500, mrp: 1099500, stock: 45, attributes: { Color: "Graphite" } },
      ],
      reviews: [{ rating: 5, title: "The gold standard mouse", comment: "Ergonomics are unmatched. Worth every single rupee." }],
    },
    {
      name: "Sony WH-1000XM4 Wireless Noise Cancelling Headphones",
      slug: "sony-wh-1000xm4-headphones",
      categorySlug: "electronics",
      brand: "Sony",
      description: "Industry leading noise cancellation, 30 hours battery life, Touch sensor controls, Speak-to-chat and multipoint pairing.",
      basePrice: 2299000,
      mrp: 2999000,
      gstRate: 18,
      variants: [
        { sku: "SONY-XM4-BLK", name: "Black", price: 2299000, mrp: 2999000, stock: 30, attributes: { Color: "Black" } },
        { sku: "SONY-XM4-SLV", name: "Silver", price: 2299000, mrp: 2999000, stock: 20, attributes: { Color: "Silver" } },
      ],
      reviews: [{ rating: 5, title: "Magical noise cancellation", comment: "Silence in busy Mumbai local trains is pure bliss." }],
    },
    {
      name: "SanDisk Extreme 1TB Portable External SSD",
      slug: "sandisk-extreme-1tb-ssd",
      categorySlug: "electronics",
      brand: "SanDisk",
      description: "Up to 1050MB/s read and 1000MB/s write speeds, IP55 water & dust resistance, USB-C 3.2 Gen 2.",
      basePrice: 949900,
      mrp: 1750000,
      gstRate: 18,
      variants: [
        { sku: "SD-EXT-1TB", name: "1TB Type-C", price: 949900, mrp: 1750000, stock: 40, attributes: { Capacity: "1TB" } },
      ],
      reviews: [{ rating: 5, title: "Blazing fast transfers", comment: "4K video files copy in seconds. Very compact." }],
    },
    {
      name: "Zebronics Transformer Gaming Keyboard & Mouse Combo",
      slug: "zebronics-transformer-combo",
      categorySlug: "electronics",
      brand: "Zebronics",
      description: "Braided cable, multi-color LED modes, all keys anti-ghosting, DPI switchable mouse with ergonomic grip.",
      basePrice: 129900,
      mrp: 249900,
      gstRate: 18,
      variants: [
        { sku: "ZEB-TRANS-RGB", name: "RGB Combo", price: 129900, mrp: 249900, stock: 75, attributes: { Edition: "RGB" } },
      ],
      reviews: [{ rating: 4, title: "Budget gaming setup", comment: "Keys feel tactile and LED lighting has good brightness." }],
    },

    // Fashion & Apparel (5)
    {
      name: "Allen Solly Men's Regular Fit Cotton Polo Shirt",
      slug: "allen-solly-mens-polo",
      categorySlug: "fashion",
      brand: "Allen Solly",
      description: "100% premium combed cotton, ribbed collar, classic embroidered stag emblem, breathable all-day comfort.",
      basePrice: 79900,
      mrp: 149900,
      gstRate: 5,
      isFeatured: true,
      variants: [
        { sku: "AS-POLO-NAV-M", name: "Navy Blue - M", price: 79900, mrp: 149900, stock: 40, attributes: { Color: "Navy Blue", Size: "M" } },
        { sku: "AS-POLO-NAV-L", name: "Navy Blue - L", price: 79900, mrp: 149900, stock: 50, attributes: { Color: "Navy Blue", Size: "L" } },
        { sku: "AS-POLO-BLK-L", name: "Jet Black - L", price: 79900, mrp: 149900, stock: 35, attributes: { Color: "Jet Black", Size: "L" } },
      ],
      reviews: [{ rating: 5, title: "Great fit and fabric", comment: "Does not shrink after washing. Soft and comfortable." }],
    },
    {
      name: "Biba Women's Cotton Straight Kurta with Palazzo",
      slug: "biba-cotton-kurta-palazzo",
      categorySlug: "fashion",
      brand: "Biba",
      description: "Traditional floral hand block prints, round neck, 3/4 sleeves, comfortable relaxed fit palazzo with elasticated waistband.",
      basePrice: 189900,
      mrp: 359900,
      gstRate: 5,
      variants: [
        { sku: "BIBA-KP-PNK-38", name: "Pastel Pink - 38", price: 189900, mrp: 359900, stock: 30, attributes: { Color: "Pastel Pink", Size: "38" } },
        { sku: "BIBA-KP-PNK-40", name: "Pastel Pink - 40", price: 189900, mrp: 359900, stock: 25, attributes: { Color: "Pastel Pink", Size: "40" } },
      ],
      reviews: [{ rating: 5, title: "Elegant festive wear", comment: "Fabric is pure cotton and stitch quality is top tier." }],
    },
    {
      name: "Fastrack Casual Analog Black Dial Men's Watch",
      slug: "fastrack-casual-analog-watch",
      categorySlug: "fashion",
      brand: "Fastrack",
      description: "Quartz movement, mineral glass, water resistance up to 50m, durable leather strap with buckle clasp.",
      basePrice: 159500,
      mrp: 239500,
      gstRate: 18,
      variants: [
        { sku: "FT-WATCH-BLK", name: "Black Leather", price: 159500, mrp: 239500, stock: 60, attributes: { Color: "Black" } },
      ],
      reviews: [{ rating: 4, title: "Sturdy and stylish daily watch", comment: "Youthful look and goes well with both formal and casual shirts." }],
    },
    {
      name: "Red Tape Men's Sneaker Shoes with Cushioned Sole",
      slug: "red-tape-mens-sneakers",
      categorySlug: "fashion",
      brand: "Red Tape",
      description: "Synthetic leather upper, memory foam comfort insole, slip-resistant TPR sole with perforated detailing.",
      basePrice: 149900,
      mrp: 549900,
      gstRate: 12,
      variants: [
        { sku: "RT-SNK-WHT-8", name: "White - UK 8", price: 149900, mrp: 549900, stock: 45, attributes: { Color: "White", Size: "UK 8" } },
        { sku: "RT-SNK-WHT-9", name: "White - UK 9", price: 149900, mrp: 549900, stock: 40, attributes: { Color: "White", Size: "UK 9" } },
      ],
      reviews: [{ rating: 5, title: "Very comfortable for walking", comment: "The memory foam insole makes a huge difference." }],
    },
    {
      name: "Wildcraft 35L Water Resistant Backpack",
      slug: "wildcraft-35l-backpack",
      categorySlug: "fashion",
      brand: "Wildcraft",
      description: "3 spacious compartments, padded laptop sleeve, side bottle mesh pockets, breathable back ventilation padding.",
      basePrice: 169900,
      mrp: 299900,
      gstRate: 18,
      variants: [
        { sku: "WC-BP-BLU", name: "Teal Blue", price: 169900, mrp: 299900, stock: 50, attributes: { Color: "Teal Blue" } },
      ],
      reviews: [{ rating: 5, title: "Durable travel backpack", comment: "Carries laptop, books, and gym gear effortlessly." }],
    },

    // Home & Kitchen (5)
    {
      name: "Prestige Iris 750W Mixer Grinder with 4 Jars",
      slug: "prestige-iris-mixer-grinder",
      categorySlug: "home-kitchen",
      brand: "Prestige",
      description: "750 Watt motor, 3 stainless steel jars + 1 polycarbonate juicer jar with blade, overload protection switch.",
      basePrice: 319900,
      mrp: 629500,
      gstRate: 18,
      isFeatured: true,
      variants: [
        { sku: "PRES-IRIS-WHT", name: "White & Blue - 750W", price: 319900, mrp: 629500, stock: 35, attributes: { Power: "750W" } },
      ],
      reviews: [{ rating: 5, title: "Chutney and dosa batter made easy", comment: "Powerful motor, grinds soaked urad dal smoothly." }],
    },
    {
      name: "Pigeon by Stovekraft Non-Stick 3 Piece Cookware Set",
      slug: "pigeon-non-stick-cookware-set",
      categorySlug: "home-kitchen",
      brand: "Pigeon",
      description: "5-layer scratch resistant non-stick coating, induction & gas compatible: Kadai with Glass Lid, Fry Pan, and Flat Dosa Tawa.",
      basePrice: 129900,
      mrp: 269500,
      gstRate: 12,
      variants: [
        { sku: "PIG-SET-RED", name: "Red Metallic", price: 129900, mrp: 269500, stock: 55, attributes: { Color: "Red" } },
      ],
      reviews: [{ rating: 4, title: "Value for money set", comment: "Dosa tawa is smooth, zero sticking even with minimal oil." }],
    },
    {
      name: "Milton Thermosteel Flip Lid 1000ml Flask",
      slug: "milton-thermosteel-flask-1000ml",
      categorySlug: "home-kitchen",
      brand: "Milton",
      description: "24 hours hot and cold retention, 100% rust-free SUS304 grade stainless steel, leak-proof flip lid with carry pouch.",
      basePrice: 99900,
      mrp: 139500,
      gstRate: 18,
      variants: [
        { sku: "MIL-FLASK-1L", name: "Silver 1000ml", price: 99900, mrp: 139500, stock: 80, attributes: { Capacity: "1000ml" } },
      ],
      reviews: [{ rating: 5, title: "Keeps water boiling hot all day", comment: "Essential for winter and road trips. Milton quality is consistent." }],
    },
    {
      name: "Wakefit 100% Cotton 300 TC King Bedsheet with Pillow Covers",
      slug: "wakefit-cotton-king-bedsheet",
      categorySlug: "home-kitchen",
      brand: "Wakefit",
      description: "Glaze cotton sateen weave, 300 Thread Count, breathable and hypoallergenic with 2 matching envelope pillow covers.",
      basePrice: 119900,
      mrp: 219900,
      gstRate: 5,
      variants: [
        { sku: "WAKE-BS-GEO", name: "Geometric Grey - King", price: 119900, mrp: 219900, stock: 45, attributes: { Pattern: "Geometric", Size: "King" } },
      ],
      reviews: [{ rating: 5, title: "Super soft texture", comment: "Fits 8 inch mattress easily with deep tucking space." }],
    },
    {
      name: "Wipro 12W Smart LED Bulb with 16M Colors",
      slug: "wipro-12w-smart-bulb",
      categorySlug: "home-kitchen",
      brand: "Wipro",
      description: "WiFi enabled smart bulb, compatible with Alexa & Google Assistant, music sync feature, tunable warm-to-cool white.",
      basePrice: 64900,
      mrp: 199900,
      gstRate: 18,
      variants: [
        { sku: "WIP-BULB-12W", name: "12W B22 Base", price: 64900, mrp: 199900, stock: 110, attributes: { Wattage: "12W", Base: "B22" } },
      ],
      reviews: [{ rating: 4, title: "Easy integration with Alexa", comment: "Dimming and scheduling routines work flawlessly." }],
    },

    // Beauty & Personal Care (5)
    {
      name: "Mamaearth Onion Hair Fall Control Shampoo 600ml",
      slug: "mamaearth-onion-hair-shampoo",
      categorySlug: "beauty",
      brand: "Mamaearth",
      description: "Enriched with Onion Oil & Plant Keratin, reduces hair fall, sulphate & paraben free, dermatologically tested for Indian hair.",
      basePrice: 48900,
      mrp: 69900,
      gstRate: 18,
      variants: [
        { sku: "MAMA-ONN-600", name: "600ml Pump Bottle", price: 48900, mrp: 69900, stock: 70, attributes: { Volume: "600ml" } },
      ],
      reviews: [{ rating: 4, title: "Reduced breakage noticeably", comment: "Smells mild, not overpowering onion odor at all." }],
    },
    {
      name: "Lakmé Absolute Skin Natural Mousse Foundation",
      slug: "lakme-absolute-mousse-foundation",
      categorySlug: "beauty",
      brand: "Lakmé",
      description: "Feather-light texture with SPF 8, 16 hours long stay, matte finish that minimizes pores and evens out Indian skin tones.",
      basePrice: 74900,
      mrp: 90000,
      gstRate: 18,
      variants: [
        { sku: "LAK-MOUSSE-IVORY", name: "01 Ivory Fair", price: 74900, mrp: 90000, stock: 35, attributes: { Shade: "Ivory Fair" } },
        { sku: "LAK-MOUSSE-HONEY", name: "03 Golden Medium", price: 74900, mrp: 90000, stock: 40, attributes: { Shade: "Golden Medium" } },
      ],
      reviews: [{ rating: 5, title: "Flawless daily wear", comment: "Feels completely weightless on the face." }],
    },
    {
      name: "The Derma Co 1% Hyaluronic Sunscreen Aqua Gel SPF 50",
      slug: "derma-co-hyaluronic-sunscreen",
      categorySlug: "beauty",
      brand: "The Derma Co",
      description: "Broad spectrum PA++++ protection with Vitamin E, ultra-lightweight aqua gel formulation with zero white cast.",
      basePrice: 44900,
      mrp: 49900,
      gstRate: 18,
      variants: [
        { sku: "DERMA-SUN-50G", name: "50g Tube", price: 44900, mrp: 49900, stock: 90, attributes: { Weight: "50g" } },
      ],
      reviews: [{ rating: 5, title: "Zero white cast", comment: "Absorbs within 10 seconds. Best sunscreen for Indian humid climate." }],
    },
    {
      name: "Philips BT1232/15 Cordless Beard Trimmer",
      slug: "philips-cordless-beard-trimmer",
      categorySlug: "beauty",
      brand: "Philips",
      description: "DuraPower technology for 4x longer battery life, self-sharpening stainless steel blades, USB charging with 30 min run time.",
      basePrice: 84900,
      mrp: 119500,
      gstRate: 18,
      variants: [
        { sku: "PHIL-BT1232-BLU", name: "Blue / Black", price: 84900, mrp: 119500, stock: 65, attributes: { Model: "BT1232" } },
      ],
      reviews: [{ rating: 4, title: "Pocket-friendly Philips precision", comment: "Blades are gentle on skin, easy USB charging via power bank." }],
    },
    {
      name: "mCaffeine Naked & Raw Coffee Body Scrub with Coconut Oil",
      slug: "mcaffeine-coffee-body-scrub",
      categorySlug: "beauty",
      brand: "mCaffeine",
      description: "Pure Arabica coffee grounds and cold-pressed coconut oil, removes tan and dead skin, promotes lymphatic drainage.",
      basePrice: 39900,
      mrp: 49900,
      gstRate: 18,
      variants: [
        { sku: "MCAF-SCRUB-100G", name: "100g Tub", price: 39900, mrp: 49900, stock: 55, attributes: { Weight: "100g" } },
      ],
      reviews: [{ rating: 5, title: "Divine coffee aroma", comment: "Skin feels velvety soft after the first use." }],
    },

    // Major Appliances (4)
    {
      name: "LG 7 Kg 5 Star Smart Inverter Front Load Washing Machine",
      slug: "lg-7kg-front-load-washing-machine",
      categorySlug: "appliances",
      brand: "LG",
      description: "6 Motion Direct Drive, Steam Wash with hygiene care, Smart Diagnosis with ThinQ app, Stainless steel drum.",
      basePrice: 2899000,
      mrp: 3899000,
      gstRate: 18,
      isFeatured: true,
      variants: [
        { sku: "LG-WM-7KG-SLV", name: "Middle Silver - 7Kg", price: 2899000, mrp: 3899000, stock: 15, attributes: { Capacity: "7Kg", Color: "Silver" } },
      ],
      reviews: [{ rating: 5, title: "Whisper quiet operation", comment: "Direct Drive motor has zero vibration during spinning." }],
    },
    {
      name: "Samsung 236 L 3 Star Digital Inverter Double Door Refrigerator",
      slug: "samsung-236l-double-door-fridge",
      categorySlug: "appliances",
      brand: "Samsung",
      description: "Frost Free, Digital Inverter Compressor with 20 year warranty, All Around Cooling, Toughened glass shelves.",
      basePrice: 2499000,
      mrp: 3199000,
      gstRate: 18,
      variants: [
        { sku: "SAM-REF-236L", name: "Elegant Inox 236L", price: 2499000, mrp: 3199000, stock: 12, attributes: { Capacity: "236 Litres" } },
      ],
      reviews: [{ rating: 5, title: "Cooling is very uniform", comment: "Keeps veggies fresh for more than a week. Low power consumption." }],
    },
    {
      name: "Voltas 1.5 Ton 3 Star Inverter Split AC (Copper Condenser)",
      slug: "voltas-1-5-ton-inverter-split-ac",
      categorySlug: "appliances",
      brand: "Voltas",
      description: "4-in-1 Adjustable Mode, Anti-dust filter with antimicrobial protection, 100% copper condenser coil, stabilizer-free operation.",
      basePrice: 3249000,
      mrp: 6299000,
      gstRate: 28,
      variants: [
        { sku: "VOLTAS-153-AC", name: "1.5 Ton - White", price: 3249000, mrp: 6299000, stock: 18, attributes: { Tonnage: "1.5 Ton" } },
      ],
      reviews: [{ rating: 4, title: "Rapid cooling even at 45°C", comment: "Cools 150 sq ft master bedroom in under 10 minutes." }],
    },
    {
      name: "IFB 24 L Convection Microwave Oven with 65 Auto Cook Menus",
      slug: "ifb-24l-convection-microwave",
      categorySlug: "appliances",
      brand: "IFB",
      description: "Baking, grilling, reheating and defrosting, stainless steel cavity, child lock, steam clean & deodorize mode.",
      basePrice: 1149000,
      mrp: 1699000,
      gstRate: 18,
      variants: [
        { sku: "IFB-MW-24L-MET", name: "Metallic Silver 24L", price: 1149000, mrp: 1699000, stock: 22, attributes: { Capacity: "24L" } },
      ],
      reviews: [{ rating: 5, title: "Baking cakes and paneer tikka", comment: "Heats evenly and auto cook recipes are handy." }],
    },

    // Books & Stationery (5)
    {
      name: "Atomic Habits by James Clear (Paperback)",
      slug: "atomic-habits-james-clear",
      categorySlug: "books",
      brand: "Random House",
      description: "An easy & proven way to build good habits & break bad ones. International #1 Bestseller on personal growth.",
      basePrice: 49900,
      mrp: 79900,
      gstRate: 0,
      isFeatured: true,
      variants: [
        { sku: "BOOK-ATOMIC-PB", name: "Paperback Edition", price: 49900, mrp: 79900, stock: 100, attributes: { Format: "Paperback" } },
      ],
      reviews: [{ rating: 5, title: "Life changing perspective", comment: "The 1% daily improvement concept is practical and transformative." }],
    },
    {
      name: "The Psychology of Money by Morgan Housel",
      slug: "the-psychology-of-money",
      categorySlug: "books",
      brand: "Jaico Publishing",
      description: "Timeless lessons on wealth, greed, and happiness. Doing well with money isn't necessarily about what you know.",
      basePrice: 29900,
      mrp: 49900,
      gstRate: 0,
      variants: [
        { sku: "BOOK-PSY-MONEY", name: "Paperback Edition", price: 29900, mrp: 49900, stock: 85, attributes: { Format: "Paperback" } },
      ],
      reviews: [{ rating: 5, title: "Must read for every Indian youth", comment: "Simple anecdotes that reshape your relationship with investing." }],
    },
    {
      name: "Ikigai: The Japanese Secret to a Long and Happy Life",
      slug: "ikigai-japanese-secret",
      categorySlug: "books",
      brand: "Penguin",
      description: "Inspiring book on finding your purpose, maintaining healthy flow in life, and longevity lessons from Okinawa.",
      basePrice: 34900,
      mrp: 59900,
      gstRate: 0,
      variants: [
        { sku: "BOOK-IKIGAI-HB", name: "Hardcover Edition", price: 34900, mrp: 59900, stock: 60, attributes: { Format: "Hardcover" } },
      ],
      reviews: [{ rating: 5, title: "Calming and reflective", comment: "Beautiful binding and heartwarming advice." }],
    },
    {
      name: "Classmate Pulse 6-Subject Spiral Notebook (300 Pages)",
      slug: "classmate-pulse-spiral-notebook",
      categorySlug: "books",
      brand: "Classmate",
      description: "Single line ruled notebook with subject dividers, high quality bright elemental chlorine-free paper.",
      basePrice: 17500,
      mrp: 22000,
      gstRate: 12,
      variants: [
        { sku: "CLASS-PULSE-300", name: "300 Pages Spiral", price: 17500, mrp: 22000, stock: 120, attributes: { Pages: "300" } },
      ],
      reviews: [{ rating: 4, title: "Ink doesn't bleed through", comment: "Sturdy plastic cover and thick smooth pages for college notes." }],
    },
    {
      name: "Parker Vector Standard Chrome Trim Rollerball Pen",
      slug: "parker-vector-rollerball-pen",
      categorySlug: "books",
      brand: "Parker",
      description: "Molded plastic barrel with stainless steel trim, ultrafine rollerball refill for smudge-proof continuous writing.",
      basePrice: 32500,
      mrp: 45000,
      gstRate: 18,
      variants: [
        { sku: "PARKER-VEC-BLU", name: "Blue Ink / Black Body", price: 32500, mrp: 45000, stock: 90, attributes: { Ink: "Blue" } },
      ],
      reviews: [{ rating: 5, title: "Classic writing instrument", comment: "Smooth ink flow, ideal gift for graduates and colleagues." }],
    },

    // Grocery & Gourmet (5)
    {
      name: "Tata Tea Gold 1kg Fresh Fragrance & Rich Taste",
      slug: "tata-tea-gold-1kg",
      categorySlug: "grocery",
      brand: "Tata",
      description: "Exquisite blend of fine Assam CTC tea leaves gently rolled with 15% long leaves for rich aroma and brisk taste.",
      basePrice: 51900,
      mrp: 67000,
      gstRate: 5,
      isFeatured: true,
      variants: [
        { sku: "TATA-GOLD-1KG", name: "1kg Poly Pack", price: 51900, mrp: 67000, stock: 100, attributes: { Weight: "1kg" } },
      ],
      reviews: [{ rating: 5, title: "Morning kadak chai staple", comment: "Authentic aroma and perfect color with milk." }],
    },
    {
      name: "Fortune Sunlite Refined Sunflower Oil 5L Can",
      slug: "fortune-sunflower-oil-5l",
      categorySlug: "grocery",
      brand: "Fortune",
      description: "Rich in Vitamin E, heart-friendly sunflower oil with high smoke point for crispy puris, samosas and everyday curries.",
      basePrice: 69900,
      mrp: 87500,
      gstRate: 5,
      variants: [
        { sku: "FORT-SUN-5L", name: "5 Litre Jar", price: 69900, mrp: 87500, stock: 75, attributes: { Volume: "5L" } },
      ],
      reviews: [{ rating: 5, title: "Light and non-greasy cooking", comment: "Puri and bhajiyas absorb very little oil." }],
    },
    {
      name: "Nutraj Premium California Almonds 500g",
      slug: "nutraj-california-almonds-500g",
      categorySlug: "grocery",
      brand: "Nutraj",
      description: "100% natural jumbo California almonds, rich in protein, dietary fiber and magnesium, vacuum packed freshness.",
      basePrice: 42900,
      mrp: 65000,
      gstRate: 5,
      variants: [
        { sku: "NUTRAJ-ALM-500", name: "500g Pouch", price: 42900, mrp: 65000, stock: 80, attributes: { Weight: "500g" } },
      ],
      reviews: [{ rating: 5, title: "Crunchy and fresh", comment: "No bitter pieces, perfectly plump when soaked overnight." }],
    },
    {
      name: "Daawat Rozana Super Basmati Rice 5kg",
      slug: "daawat-rozana-basmati-rice-5kg",
      categorySlug: "grocery",
      brand: "Daawat",
      description: "Aged long grain aromatic basmati rice for daily meals, biryani, pulao and fried rice with non-sticky grains.",
      basePrice: 38900,
      mrp: 49500,
      gstRate: 5,
      variants: [
        { sku: "DAAWAT-ROZ-5KG", name: "5kg Bag", price: 38900, mrp: 49500, stock: 65, attributes: { Weight: "5kg" } },
      ],
      reviews: [{ rating: 4, title: "Great aroma and length", comment: "Grains stay separate and fluffy after cooking." }],
    },
    {
      name: "Nescafe Classic Instant Coffee Powder 200g Glass Jar",
      slug: "nescafe-classic-coffee-200g",
      categorySlug: "grocery",
      brand: "Nescafe",
      description: "100% pure coffee crafted from medium-dark roasted Robusta beans for bold flavor and refreshing froth.",
      basePrice: 58500,
      mrp: 68000,
      gstRate: 18,
      variants: [
        { sku: "NES-CLASS-200G", name: "200g Jar", price: 58500, mrp: 68000, stock: 90, attributes: { Weight: "200g" } },
      ],
      reviews: [{ rating: 5, title: "Instant energy in every sip", comment: "Mixes easily for both hot coffee and iced frappes." }],
    },

    // Sports & Fitness (4)
    {
      name: "Boldfit TPE Yoga Mat 6mm with Carrying Strap",
      slug: "boldfit-tpe-yoga-mat-6mm",
      categorySlug: "sports",
      brand: "Boldfit",
      description: "Eco-friendly non-slip double layer TPE material, extra thick 6mm cushioning for joints during yoga, pilates & floor exercises.",
      basePrice: 89900,
      mrp: 199900,
      gstRate: 18,
      isFeatured: true,
      variants: [
        { sku: "BOLD-YOGA-BLU", name: "Royal Blue 6mm", price: 89900, mrp: 199900, stock: 50, attributes: { Color: "Royal Blue" } },
      ],
      reviews: [{ rating: 5, title: "Excellent grip on marble floor", comment: "Does not skid at all during downward dog or lunges." }],
    },
    {
      name: "Kore PVC 20 Kg Home Gym Combo Set with Dumbbells",
      slug: "kore-pvc-20kg-home-gym-set",
      categorySlug: "sports",
      brand: "Kore",
      description: "Includes 20kg weight plates (2kg x 4, 3kg x 4), 1x 3-foot curl rod, 2x dumbbell rods, skipping rope, and hand gripper.",
      basePrice: 154900,
      mrp: 399900,
      gstRate: 18,
      variants: [
        { sku: "KORE-GYM-20KG", name: "20Kg Complete Combo", price: 154900, mrp: 399900, stock: 25, attributes: { Weight: "20Kg" } },
      ],
      reviews: [{ rating: 4, title: "Ideal beginner setup for home workouts", comment: "Has all basic equipment to start strength training at home." }],
    },
    {
      name: "Yonex GR 303 Aluminum Badminton Racquet with Full Cover",
      slug: "yonex-gr-303-badminton-racquet",
      categorySlug: "sports",
      brand: "Yonex",
      description: "Lightweight aluminum frame, low torsion steel shaft, durable gutting string, ideal for recreational and intermediate play.",
      basePrice: 59900,
      mrp: 99000,
      gstRate: 12,
      variants: [
        { sku: "YONEX-GR303-BLU", name: "Metallic Blue", price: 59900, mrp: 99000, stock: 70, attributes: { Color: "Metallic Blue" } },
      ],
      reviews: [{ rating: 5, title: "Sturdy frame and good balance", comment: "Handles aggressive smashes without bending." }],
    },
    {
      name: "Nivia Storm Football Size 5 (Rubberized Moulded)",
      slug: "nivia-storm-football-size-5",
      categorySlug: "sports",
      brand: "Nivia",
      description: "32-panel rubberized molded construction, all-weather durability for hard, rough ground, grass, and artificial turf.",
      basePrice: 44900,
      mrp: 65000,
      gstRate: 12,
      variants: [
        { sku: "NIVIA-STORM-SZ5", name: "Size 5 Standard", price: 44900, mrp: 65000, stock: 60, attributes: { Size: "Size 5" } },
      ],
      reviews: [{ rating: 5, title: "Great bounce on muddy grounds", comment: "Lasted through full monsoon season with no air leakage." }],
    },
  ];

  for (const prod of productsData) {
    const category = categories[prod.categorySlug];
    if (!category) continue;

    // Generate local SVG product image
    const imagePath = saveProductSvgLocally(prod.slug, {
      title: prod.name,
      category: category.name,
      brand: prod.brand,
    });

    const product = await prisma.product.create({
      data: {
        name: prod.name,
        slug: prod.slug,
        brand: prod.brand,
        description: prod.description,
        basePrice: prod.basePrice,
        mrp: prod.mrp,
        gstRate: prod.gstRate,
        isFeatured: prod.isFeatured || false,
        categoryId: category.id,
        images: {
          create: [
            {
              url: imagePath,
              altText: prod.name,
              isPrimary: true,
              displayOrder: 0,
            },
          ],
        },
        variants: {
          create: prod.variants.map((v) => ({
            sku: v.sku,
            name: v.name,
            price: v.price,
            mrp: v.mrp,
            stock: v.stock,
            attributes: v.attributes,
          })),
        },
        reviews: {
          create: prod.reviews.map((r, rIdx) => ({
            userId: rIdx === 0 ? customer.id : customer2.id,
            rating: r.rating,
            title: r.title,
            comment: r.comment,
            isVerifiedPurchase: true,
            isApproved: true,
          })),
        },
      },
    });
  }

  console.log(`🛍️ Created ${productsData.length} realistic products across 9 categories with variants and reviews`);

  // 5. Seed Coupons
  const validCoupon1 = await prisma.coupon.create({
    data: {
      code: "WELCOME10",
      type: CouponType.PERCENTAGE,
      value: 10, // 10%
      minOrderAmount: 50000, // ₹500
      maxDiscount: 30000, // ₹300
      usageLimit: 1000,
      perUserLimit: 1,
      validFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
  });

  const validCoupon2 = await prisma.coupon.create({
    data: {
      code: "FLAT200",
      type: CouponType.FLAT,
      value: 20000, // ₹200
      minOrderAmount: 99900, // ₹999
      maxDiscount: null,
      usageLimit: 500,
      perUserLimit: 2,
      validFrom: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      validUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
  });

  const expiredCoupon = await prisma.coupon.create({
    data: {
      code: "FESTIVE50",
      type: CouponType.PERCENTAGE,
      value: 50,
      minOrderAmount: 200000,
      maxDiscount: 100000,
      usageLimit: 100,
      perUserLimit: 1,
      validFrom: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
      validUntil: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Expired 30 days ago
      isActive: false,
    },
  });

  console.log(`🎟️ Seeded 3 coupons (${validCoupon1.code}, ${validCoupon2.code}, ${expiredCoupon.code})`);

  // 6. Seed a sample past completed order for Customer to populate order history immediately
  const sampleVariant = await prisma.productVariant.findFirst({
    where: { sku: "BOAT-141-BLK" },
    include: { product: true },
  });

  if (sampleVariant) {
    const address = await prisma.address.findFirst({ where: { userId: customer.id } });
    if (address) {
      const sampleOrder = await prisma.order.create({
        data: {
          orderNumber: "SN-2026-0001",
          userId: customer.id,
          status: OrderStatus.DELIVERED,
          shippingAddressSnapshot: address,
          billingAddressSnapshot: address,
          subtotal: 149900,
          discount: 0,
          shippingFee: 0,
          taxAmount: 22866, // 18% GST on 149900 paise
          grandTotal: 149900,
          paymentMethod: PaymentMethod.COD,
          paymentStatus: PaymentStatus.CAPTURED,
          items: {
            create: [
              {
                variantId: sampleVariant.id,
                productName: sampleVariant.product.name,
                sku: sampleVariant.sku,
                variantName: sampleVariant.name,
                unitPrice: sampleVariant.price,
                mrp: sampleVariant.mrp,
                gstRate: sampleVariant.product.gstRate,
                taxAmount: 22866,
                discountAmount: 0,
                totalPrice: sampleVariant.price,
                quantity: 1,
                imageSnapshot: `/images/products/${sampleVariant.product.slug}.svg`,
              },
            ],
          },
          statusHistory: {
            create: [
              { previousStatus: OrderStatus.PENDING_PAYMENT, newStatus: OrderStatus.PROCESSING, reason: "Order confirmed" },
              { previousStatus: OrderStatus.PROCESSING, newStatus: OrderStatus.SHIPPED, reason: "Dispatched via Blue Dart" },
              { previousStatus: OrderStatus.SHIPPED, newStatus: OrderStatus.DELIVERED, reason: "Delivered to customer and COD collected" },
            ],
          },
        },
      });
      console.log(`📦 Seeded sample delivered order ${sampleOrder.orderNumber} for customer`);
    }
  }

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
