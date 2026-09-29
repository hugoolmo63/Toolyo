import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/server/auth/password";

/**
 * Semilla mínima y determinista (TESTING.md §6).
 * No depende de datos reales ni de red; idempotente en contenido.
 * Incluye listings de ejemplo para 004-public-search.
 */
const prisma = new PrismaClient();

async function main() {
  const categoryGroups = [
    {
      name: "Tecnología y Electrónica",
      slug: "tecnologia-y-electronica",
      children: [
        ["Cámaras y Fotografía", "camaras-y-fotografia"],
        ["Audio y Sonido", "audio-y-sonido"],
        ["Informática y Consolas", "informatica-y-consolas"],
        ["Telefonía y Gadgets", "telefonia-y-gadgets"],
      ],
    },
    {
      name: "Ocio y Deporte",
      slug: "ocio-y-deporte",
      children: [
        ["Deportes de Raqueta", "deportes-de-raqueta"],
        ["Ciclismo y Movilidad Urbana", "ciclismo-y-movilidad-urbana"],
        ["Acampada y Montaña", "acampada-y-montana"],
        ["Deportes Acuáticos", "deportes-acuaticos"],
      ],
    },
    {
      name: "Bricolaje y Profesional",
      slug: "bricolaje-y-profesional",
      children: [
        ["Herramientas Eléctricas", "herramientas-electricas"],
        ["Herramientas Manuales", "herramientas-manuales"],
        ["Maquinaria de Jardín", "maquinaria-de-jardin"],
        ["Construcción y Reformas", "construccion-y-reformas"],
      ],
    },
    {
      name: "Vehículos y Transporte",
      slug: "vehiculos-y-transporte",
      children: [
        ["Coches y Motos", "coches-y-motos"],
        ["Remolques y Transporte", "remolques-y-transporte"],
        ["Caravanas y Furgonetas Camper", "caravanas-y-furgonetas-camper"],
      ],
    },
    {
      name: "Hogar y Eventos",
      slug: "hogar-y-eventos",
      children: [
        ["Sonido e Iluminación para Fiestas", "sonido-iluminacion-para-fiestas"],
        ["Mobiliario, Limpieza y Mudanzas", "mobiliario-limpieza-y-mudanzas"],
        ["Fotomatón y Decoración", "fotomaton-y-decoracion"],
      ],
    },
  ] as const;

  // Desactiva categorías antiguas antes de reconstruir la jerarquía canónica.
  await prisma.category.updateMany({ data: { showInNav: false, parentId: null } });

  const categoryBySlug = new Map<string, { id: string }>();
  for (const group of categoryGroups) {
    const parent = await prisma.category.upsert({
      where: { slug: group.slug },
      update: { name: group.name, showInNav: true, parentId: null },
      create: { name: group.name, slug: group.slug, showInNav: true },
      select: { id: true },
    });
    categoryBySlug.set(group.slug, parent);

    for (const [name, slug] of group.children) {
      const child = await prisma.category.upsert({
        where: { slug },
        update: { name, showInNav: false, parentId: parent.id },
        create: { name, slug, showInNav: false, parentId: parent.id },
        select: { id: true },
      });
      categoryBySlug.set(slug, child);
    }
  }

  const documents = [
    { documentType: "terms" as const, version: "2026-08", language: "es", contentHash: "seed-terms-2026-08" },
    { documentType: "privacy" as const, version: "2026-08", language: "es", contentHash: "seed-privacy-2026-08" },
    { documentType: "marketing" as const, version: "2026-08", language: "es", contentHash: "seed-marketing-2026-08" },
  ];
  for (const document of documents) {
    await prisma.legalDocument.upsert({
      where: { documentType_version_language: { documentType: document.documentType, version: document.version, language: document.language } },
      update: { retiredAt: null },
      create: { ...document, effectiveAt: new Date("2026-01-01T00:00:00.000Z") },
    });
  }

  // ── 004-public-search: arrendadores y listings de ejemplo ──

  const category = (slug: string) => categoryBySlug.get(slug)!;
  const camerasCat = category("camaras-y-fotografia");
  const audioCat = category("audio-y-sonido");
  const computersCat = category("informatica-y-consolas");
  const gadgetsCat = category("telefonia-y-gadgets");
  const racketCat = category("deportes-de-raqueta");
  const cyclingCat = category("ciclismo-y-movilidad-urbana");
  const campingCat = category("acampada-y-montana");
  const waterSportsCat = category("deportes-acuaticos");
  const electricToolsCat = category("herramientas-electricas");
  const manualToolsCat = category("herramientas-manuales");
  const gardenCat = category("maquinaria-de-jardin");
  const constructionCat = category("construccion-y-reformas");
  const carsAndMotorcyclesCat = category("coches-y-motos");
  const trailersCat = category("remolques-y-transporte");
  const camperCat = category("caravanas-y-furgonetas-camper");

  // Arrendadores: 4 usuarios activos, 2 verificados y 2 no verificados
  // Con datos de perfil público: displayName, avatarUrl, bio, rating, responseTime, transactions
  const owners = [
    {
      email: "owner-verified-1@toolyo.dev",
      verified: true,
      name: "Ana García",
      bio: "Fotógrafa profesional con 10 años de experiencia. Alquiler de equipo audiovisual cuidado y revisado.",
      avatarUrl: "https://i.pravatar.cc/150?img=1",
      ratingAverage: 4.8,
      responseTimeHours: 2,
      transactionCount: 47,
    },
    {
      email: "owner-verified-2@toolyo.dev",
      verified: true,
      name: "Carlos Ruiz",
      bio: "Técnico de sonido y eventos. Material siempre revisado antes de cada entrega.",
      avatarUrl: "https://i.pravatar.cc/150?img=3",
      ratingAverage: 4.6,
      responseTimeHours: 4,
      transactionCount: 32,
    },
    {
      email: "owner-unverified-1@toolyo.dev",
      verified: false,
      name: "Beatriz López",
      bio: "Amante del deporte y la montaña. Alquilo equipo en buen estado para tus aventuras.",
      avatarUrl: "https://i.pravatar.cc/150?img=5",
      ratingAverage: 4.2,
      responseTimeHours: 8,
      transactionCount: 12,
    },
    {
      email: "owner-unverified-2@toolyo.dev",
      verified: false,
      name: "David Martín",
      bio: "Entusiasta de la electrónica y los gadgets. Disponible para resolver dudas.",
      avatarUrl: null,
      ratingAverage: null,
      responseTimeHours: null,
      transactionCount: 0,
    },
  ];

  const ownerIds: string[] = [];
  for (const owner of owners) {
    const user = await prisma.user.upsert({
      where: { emailNormalized: owner.email },
      update: {
        accountStatus: "active",
        role: "user",
        displayName: owner.name,
        avatarUrl: owner.avatarUrl,
        bio: owner.bio,
        ratingAverage: owner.ratingAverage,
        responseTimeHours: owner.responseTimeHours,
        transactionCount: owner.transactionCount,
      },
      create: {
        emailNormalized: owner.email,
        accountStatus: "active",
        role: "user",
        displayName: owner.name,
        avatarUrl: owner.avatarUrl,
        bio: owner.bio,
        ratingAverage: owner.ratingAverage,
        responseTimeHours: owner.responseTimeHours,
        transactionCount: owner.transactionCount,
        passwordCredential: { create: { passwordHash: "hash:placeholder" } },
      },
    });
    ownerIds.push(user.id);

    if (owner.verified) {
      await prisma.verificationState.upsert({
        where: { userId_channel: { userId: user.id, channel: "identity" } },
        update: { status: "verified" },
        create: {
          userId: user.id,
          channel: "identity",
          status: "verified",
          verifiedAt: new Date(),
        },
      });
    }
  }

  const testUserPasswordHash = await hashPassword("passwordpassword123");
  const testUser = await prisma.user.upsert({
    where: { emailNormalized: "test@test.com" },
    update: {
      accountStatus: "active",
      role: "user",
      displayName: "Usuario de prueba",
      passwordCredential: { upsert: { update: { passwordHash: testUserPasswordHash }, create: { passwordHash: testUserPasswordHash } } },
    },
    create: {
      emailNormalized: "test@test.com",
      accountStatus: "active",
      role: "user",
      displayName: "Usuario de prueba",
      passwordCredential: { create: { passwordHash: testUserPasswordHash } },
    },
    select: { id: true },
  });

  const adminPasswordHash = await hashPassword("AdminPassword123!");
  await prisma.user.upsert({
    where: { emailNormalized: "admin@toolyo.dev" },
    update: { accountStatus: "active", role: "ADMIN", displayName: "Toolyo Admin", passwordCredential: { upsert: { update: { passwordHash: adminPasswordHash }, create: { passwordHash: adminPasswordHash } } } },
    create: { emailNormalized: "admin@toolyo.dev", accountStatus: "active", role: "ADMIN", displayName: "Toolyo Admin", passwordCredential: { create: { passwordHash: adminPasswordHash } } },
  });
  await prisma.user.upsert({
    where: { emailNormalized: "moderator@toolyo.dev" },
    update: { accountStatus: "active", role: "MODERATOR", displayName: "Toolyo Moderator", passwordCredential: { upsert: { update: { passwordHash: adminPasswordHash }, create: { passwordHash: adminPasswordHash } } } },
    create: { emailNormalized: "moderator@toolyo.dev", accountStatus: "active", role: "MODERATOR", displayName: "Toolyo Moderator", passwordCredential: { create: { passwordHash: adminPasswordHash } } },
  });

  await prisma.verificationState.upsert({
    where: { userId_channel: { userId: testUser.id, channel: "identity" } },
    update: { status: "verified", verifiedAt: new Date() },
    create: { userId: testUser.id, channel: "identity", status: "verified", verifiedAt: new Date() },
  });

  await prisma.review.deleteMany({});
  await prisma.listingAvailability.deleteMany({ where: { id: { startsWith: "seed-avail-" } } });
  const reviewComments = [
    "Funciona muy bien, pero la luz está rota.",
    "Trato increíble, ofrece nuevas brocas por 3€ cada una.",
    "La herramienta estaba impecable y la entrega fue puntual.",
    "Todo perfecto y muy fácil de coordinar.",
    "Buen producto para un proyecto de fin de semana.",
    "Respondió rápido y explicó muy bien cómo usarlo.",
  ];

  // Ciudades españolas con coordenadas (WGS84)
  const cities = [
    { name: "Madrid", lat: 40.4168, lng: -3.7038 },
    { name: "Barcelona", lat: 41.3851, lng: 2.1734 },
    { name: "Valencia", lat: 39.4699, lng: -0.3763 },
    { name: "Sevilla", lat: 37.3886, lng: -5.9823 },
    { name: "Bilbao", lat: 43.263, lng: -2.935 },
    { name: "Málaga", lat: 36.5213, lng: -4.4854 },
    { name: "Zaragoza", lat: 41.6488, lng: -0.8891 },
    { name: "Murcia", lat: 37.9922, lng: -1.1307 },
    { name: "Palma", lat: 39.5696, lng: 2.6502 },
    { name: "Granada", lat: 37.1773, lng: -3.5986 },
  ];

  // Plantillas de listings por categoría (100 productos)
  const listingTemplates = [
    // ── Cámaras y foto (16) ──
    { title: "Cámara mirrorless 4K", category: camerasCat, pricePerDay: 45 },
    { title: "Objetivo 50mm f/1.8", category: camerasCat, pricePerDay: 15 },
    { title: "Trípode de carbono", category: camerasCat, pricePerDay: 12 },
    { title: "Drone con cámara 4K", category: camerasCat, pricePerDay: 60 },
    { title: "Cámara de acción sumergible", category: camerasCat, pricePerDay: 20 },
    { title: "Cámara réflex con lente", category: camerasCat, pricePerDay: 55 },
    { title: "Estabilizador gimbal 3 ejes", category: camerasCat, pricePerDay: 24 },
    { title: "Objetivo gran angular 14mm", category: camerasCat, pricePerDay: 22 },
    { title: "Teleobjetivo 70-200mm", category: camerasCat, pricePerDay: 35 },
    { title: "Cámara de vídeo cinematográfica", category: camerasCat, pricePerDay: 120 },
    { title: "Set de filtros ND", category: camerasCat, pricePerDay: 8 },
    { title: "Iluminador de anillo LED", category: camerasCat, pricePerDay: 10 },
    { title: "Slider de cámara motorizado", category: camerasCat, pricePerDay: 18 },
    { title: "Cámara instantánea retro", category: camerasCat, pricePerDay: 9 },
    { title: "Trípode flexible gorillapod", category: camerasCat, pricePerDay: 6 },
    { title: "Monitor de campo 7 pulgadas", category: camerasCat, pricePerDay: 14 },

    // ── Audio (14) ──
    { title: "Altavoz Bluetooth premium", category: audioCat, pricePerDay: 18 },
    { title: "Auriculares con cancelación de ruido", category: audioCat, pricePerDay: 10 },
    { title: "Micrófono condensador USB", category: audioCat, pricePerDay: 14 },
    { title: "Set de luces RGB para streaming", category: audioCat, pricePerDay: 16 },
    { title: "Mesa de mezclas 8 canales", category: audioCat, pricePerDay: 30 },
    { title: "Sistema de sonido PA 500W", category: audioCat, pricePerDay: 65 },
    { title: "Micrófono inalámbrico dual", category: audioCat, pricePerDay: 20 },
    { title: "Auriculares de estudio", category: audioCat, pricePerDay: 8 },
    { title: "Interfaz de audio USB", category: audioCat, pricePerDay: 18 },
    { title: "Altavoz inteligente con asistente", category: audioCat, pricePerDay: 12 },
    { title: "Gramola vintage Bluetooth", category: audioCat, pricePerDay: 25 },
    { title: "Subwoofer activo 18 pulgadas", category: audioCat, pricePerDay: 40 },
    { title: "Micrófono de solapa para entrevistas", category: audioCat, pricePerDay: 7 },
    { title: "Pantalla acústica plegable", category: audioCat, pricePerDay: 9 },

    // ── Electrónica (20) ──
    { title: "Proyector Full HD", category: computersCat, pricePerDay: 35 },
    { title: "Portátil gaming", category: computersCat, pricePerDay: 50 },
    { title: "Monitor 27\" 4K", category: computersCat, pricePerDay: 25 },
    { title: "Consola de última generación", category: computersCat, pricePerDay: 30 },
    { title: "Set de iluminación LED", category: gadgetsCat, pricePerDay: 28 },
    { title: "Escáner 3D portátil", category: computersCat, pricePerDay: 70 },
    { title: "Impresora 3D", category: computersCat, pricePerDay: 40 },
    { title: "Robot aspirador", category: gadgetsCat, pricePerDay: 12 },
    { title: "Freidora de aire XL", category: gadgetsCat, pricePerDay: 8 },
    { title: "Pantalla LED 100 pulgadas", category: computersCat, pricePerDay: 90 },
    { title: "Mini PC silencioso", category: computersCat, pricePerDay: 22 },
    { title: "Tablet gráfica profesional", category: computersCat, pricePerDay: 18 },
    { title: "Router WiFi 6 mesh", category: gadgetsCat, pricePerDay: 8 },
    { title: "Cámara de videovigilancia 4K", category: gadgetsCat, pricePerDay: 10 },
    { title: "Disco duro externo 4TB", category: computersCat, pricePerDay: 5 },
    { title: "Auriculares VR todo-en-uno", category: gadgetsCat, pricePerDay: 35 },
    { title: "Teclado mecánico RGB", category: computersCat, pricePerDay: 10 },
    { title: "Hub USB-C 12 en 1", category: gadgetsCat, pricePerDay: 5 },
    { title: "Cargador solar portátil", category: gadgetsCat, pricePerDay: 6 },
    { title: "Proyector láser 4K ultra-corta", category: computersCat, pricePerDay: 150 },

    // ── Herramientas (16) ──
    { title: "Taladro percusión profesional", category: electricToolsCat, pricePerDay: 12 },
    { title: "Andamio modular 2m", category: constructionCat, pricePerDay: 20 },
    { title: "Compresor de aire 50L", category: electricToolsCat, pricePerDay: 18 },
    { title: "Sierra circular", category: electricToolsCat, pricePerDay: 15 },
    { title: "Máquina de coser", category: manualToolsCat, pricePerDay: 14 },
    { title: "Hidrolimpiadora", category: gardenCat, pricePerDay: 22 },
    { title: "Caja de herramientas completa", category: manualToolsCat, pricePerDay: 16 },
    { title: "Amoladora angular 230mm", category: electricToolsCat, pricePerDay: 10 },
    { title: "Soldadora inverter MMA", category: electricToolsCat, pricePerDay: 25 },
    { title: "Carretilla reforzada 200L", category: manualToolsCat, pricePerDay: 8 },
    { title: "Andamio de aluminio 6m", category: constructionCat, pricePerDay: 45 },
    { title: "Pulidora de paredes", category: electricToolsCat, pricePerDay: 18 },
    { title: "Detector de tuberías y cables", category: manualToolsCat, pricePerDay: 7 },
    { title: "Martillo demoledor eléctrico", category: electricToolsCat, pricePerDay: 30 },
    { title: "Set de brocas para mampostería", category: manualToolsCat, pricePerDay: 5 },
    { title: "Generador eléctrico 3kW", category: electricToolsCat, pricePerDay: 35 },

    // ── Deporte y aire libre (18) ──
    { title: "Bicicleta de montaña", category: cyclingCat, pricePerDay: 22 },
    { title: "Kayak inflable", category: waterSportsCat, pricePerDay: 28 },
    { title: "Tabla de paddle surf", category: waterSportsCat, pricePerDay: 25 },
    { title: "Casetas de campaña 4 plazas", category: campingCat, pricePerDay: 16 },
    { title: "Equipo de escalada completo", category: campingCat, pricePerDay: 40 },
    { title: "Tabla de snowboard", category: campingCat, pricePerDay: 26 },
    { title: "Raquetas de tenis", category: racketCat, pricePerDay: 10 },
    { title: "Set de palas de pádel", category: racketCat, pricePerDay: 12 },
    { title: "Bicicleta de carretera carbono", category: cyclingCat, pricePerDay: 45 },
    { title: "Saco de dormir -10°C", category: campingCat, pricePerDay: 8 },
    { title: "Canoa para 2 personas", category: waterSportsCat, pricePerDay: 30 },
    { title: "Equipo completo de buceo", category: waterSportsCat, pricePerDay: 55 },
    { title: "Tabla de surf 6'2\"", category: waterSportsCat, pricePerDay: 20 },
    { title: "Botas de trekking impermeables", category: campingCat, pricePerDay: 7 },
    { title: "Mochila de expedición 60L", category: campingCat, pricePerDay: 6 },
    { title: "Estación meteorológica portátil", category: campingCat, pricePerDay: 9 },
    { title: "Set de pesca con caña y carrete", category: waterSportsCat, pricePerDay: 14 },
    { title: "Trineo de plástico para nieve", category: campingCat, pricePerDay: 5 },

    // ── Vehículos (16) ──
    { title: "Patinete eléctrico", category: cyclingCat, pricePerDay: 20 },
    { title: "Bicicleta eléctrica plegable", category: cyclingCat, pricePerDay: 30 },
    { title: "Remolque de carga", category: trailersCat, pricePerDay: 35 },
    { title: "Furgoneta camper", category: camperCat, pricePerDay: 95 },
    { title: "Coche clásico para eventos", category: carsAndMotorcyclesCat, pricePerDay: 150 },
    { title: "Moto scooter 125cc", category: carsAndMotorcyclesCat, pricePerDay: 40 },
    { title: "Quad 250cc off-road", category: carsAndMotorcyclesCat, pricePerDay: 60 },
    { title: "Furgoneta de mudanza 3.5T", category: trailersCat, pricePerDay: 70 },
    { title: "Bicicleta tandem", category: cyclingCat, pricePerDay: 18 },
    { title: "Remolque porta-motos", category: trailersCat, pricePerDay: 25 },
    { title: "Monociclo eléctrico", category: cyclingCat, pricePerDay: 22 },
    { title: "Patinete eléctrico de asiento", category: cyclingCat, pricePerDay: 28 },
    { title: "Furgoneta refrigerada", category: trailersCat, pricePerDay: 85 },
    { title: "Coche eléctrico largo alcance", category: carsAndMotorcyclesCat, pricePerDay: 75 },
    { title: "Moto de trail 500cc", category: carsAndMotorcyclesCat, pricePerDay: 55 },
    { title: "Ciclomotor clásico restaurado", category: carsAndMotorcyclesCat, pricePerDay: 35 },
  ];

  // Generar 100 listings distribuidos en ciudades y arrendadores
  let listingIndex = 0;
  for (const template of listingTemplates) {
    const city = cities[listingIndex % cities.length]!;
    const ownerId = ownerIds[listingIndex % ownerIds.length]!;
    const rating = 3.5 + ((listingIndex * 7) % 16) / 10; // 3.5 a 5.0
    const reviewCount = listingIndex < 10 ? 0 : 1 + (listingIndex % 3);
    const viewCount = (listingIndex * 17 + 5) % 500;
    const slug = `${template.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${listingIndex}`;
    const status = listingIndex % 5 === 4 ? "draft" : "published"; // mayoría published, algunos draft

    // Insertar via SQL raw para poder setear location con PostGIS
    const id = `seed-listing-${listingIndex}`;
    await prisma.$executeRaw`
      INSERT INTO "Listing" (
        "id", "ownerId", "categoryId", "title", "slug", "description",
        "pricePerDay", "location", "lat", "lng", "addressText", "city",
        "status", "ratingAverage", "reviewCount", "viewCount", "isInstantBooking",
        "createdAt", "updatedAt"
      ) VALUES (
        ${id},
        ${ownerId},
        ${template.category.id},
        ${template.title},
        ${slug},
        ${`${template.title} en alquiler en ${city.name}. Disponible para reservas por días.`},
        ${template.pricePerDay},
        ST_GeomFromText(${`POINT(${city.lng} ${city.lat})`}, 4326),
        ${city.lat},
        ${city.lng},
        ${`${city.name}, España`},
        ${city.name},
        ${status}::"ListingStatus",
        ${rating},
        ${reviewCount},
        ${viewCount},
        false,
        NOW(),
        NOW()
      )
      ON CONFLICT ("id") DO UPDATE SET
        "title" = EXCLUDED."title",
        "pricePerDay" = EXCLUDED."pricePerDay",
        "location" = EXCLUDED."location",
        "lat" = EXCLUDED."lat",
        "lng" = EXCLUDED."lng",
        "city" = EXCLUDED."city",
        "status" = EXCLUDED."status",
        "ratingAverage" = EXCLUDED."ratingAverage",
        "updatedAt" = NOW()
    `;

    // Foto principal para cada listing. Usar la URL /id evita la redirección
    // de /seed hacia fastly.picsum.photos, que rompe algunos optimizadores.
    const photoId = `seed-photo-${listingIndex}`;
    const photoUrl = `https://picsum.photos/id/${100 + listingIndex}/800/600.jpg`;
    await prisma.listingPhoto.upsert({
      where: { id: photoId },
      update: {
        url: photoUrl,
        altText: `${template.title}`,
        order: 0,
      },
      create: {
        id: photoId,
        listingId: id,
        url: photoUrl,
        altText: `${template.title}`,
        order: 0,
      },
    });

    if (listingIndex >= 10) {
      for (let reviewIndex = 0; reviewIndex < reviewCount; reviewIndex += 1) {
        const authorId = ownerIds[(listingIndex + reviewIndex + 1) % ownerIds.length]!;
        await prisma.review.upsert({
          where: { id: `seed-review-${listingIndex}-${reviewIndex}` },
          update: {
            authorId,
            rating: 3 + ((listingIndex + reviewIndex) % 3),
            overallRating: 3 + ((listingIndex + reviewIndex) % 3),
            status: "published",
            comment: reviewComments[(listingIndex + reviewIndex) % reviewComments.length],
            deletedAt: null,
          },
          create: {
            id: `seed-review-${listingIndex}-${reviewIndex}`,
            listingId: id,
            authorId,
            rating: 3 + ((listingIndex + reviewIndex) % 3),
            overallRating: 3 + ((listingIndex + reviewIndex) % 3),
            status: "published",
            comment: reviewComments[(listingIndex + reviewIndex) % reviewComments.length],
            createdAt: new Date(Date.now() - (listingIndex + reviewIndex) * 86_400_000),
          },
        });
      }
    }

    if (listingIndex >= 10) {
      const aggregate = await prisma.review.aggregate({
        where: { listingId: id, deletedAt: null },
        _avg: { rating: true },
        _count: { _all: true },
      });
      await prisma.listing.update({
        where: { id },
        data: { ratingAverage: aggregate._avg.rating ?? 0, reviewCount: aggregate._count._all },
      });
    }

    // Algunos listings con bloqueos de disponibilidad
    if (listingIndex % 6 === 0) {
      const blockedDate = new Date();
      blockedDate.setDate(blockedDate.getDate() + 7 + listingIndex);
      const availId = `seed-avail-${listingIndex}`;
      await prisma.listingAvailability.upsert({
        where: { listingId_blockedDate: { listingId: id, blockedDate: blockedDate } },
        update: {},
        create: {
          id: availId,
          listingId: id,
          blockedDate,
          reason: "Reserva confirmada",
        },
      });
    }

    listingIndex++;
  }

  for (let testListingIndex = 0; testListingIndex < 10; testListingIndex++) {
    const city = cities[testListingIndex % cities.length]!;
    const id = `test-listing-${testListingIndex + 1}`;
    const title = `Producto de prueba ${testListingIndex + 1}`;
    const slug = `producto-de-prueba-${testListingIndex + 1}`;
    const pricePerDay = 10 + testListingIndex * 3;

    await prisma.$executeRaw`
      INSERT INTO "Listing" (
        "id", "ownerId", "categoryId", "title", "slug", "description",
        "pricePerDay", "location", "lat", "lng", "addressText", "city",
        "status", "ratingAverage", "reviewCount", "viewCount", "isInstantBooking",
        "createdAt", "updatedAt"
      ) VALUES (
        ${id},
        ${testUser.id},
        ${camerasCat.id},
        ${title},
        ${slug},
        ${`${title} preparado para pruebas del panel de gestión.`},
        ${pricePerDay},
        ST_GeomFromText(${`POINT(${city.lng} ${city.lat})`}, 4326),
        ${city.lat},
        ${city.lng},
        ${`${city.name}, España`},
        ${city.name},
        'published'::"ListingStatus",
        5.0,
        0,
        0,
        false,
        NOW(),
        NOW()
      )
      ON CONFLICT ("id") DO UPDATE SET
        "ownerId" = EXCLUDED."ownerId",
        "categoryId" = EXCLUDED."categoryId",
        "title" = EXCLUDED."title",
        "slug" = EXCLUDED."slug",
        "description" = EXCLUDED."description",
        "pricePerDay" = EXCLUDED."pricePerDay",
        "location" = EXCLUDED."location",
        "lat" = EXCLUDED."lat",
        "lng" = EXCLUDED."lng",
        "addressText" = EXCLUDED."addressText",
        "city" = EXCLUDED."city",
        "status" = EXCLUDED."status",
        "deletedAt" = NULL,
        "updatedAt" = NOW()
    `;

    await prisma.listingPhoto.upsert({
      where: { id: `test-photo-${testListingIndex + 1}` },
      update: {
        url: `https://picsum.photos/seed/toolyo-test-${testListingIndex + 1}/800/600`,
        altText: title,
        order: 0,
        deletedAt: null,
      },
      create: {
        id: `test-photo-${testListingIndex + 1}`,
        listingId: id,
        url: `https://picsum.photos/seed/toolyo-test-${testListingIndex + 1}/800/600`,
        altText: title,
        order: 0,
      },
    });
  }

  // ── 008-modulo-reservas: reserva y conversación deterministas ──
  // El listing de prueba pertenece a testUser; el primer owner seed actúa como renter.
  const bookingOwnerId = testUser.id;
  const bookingRenterId = ownerIds[0]!;
  const bookingListingId = "test-listing-1";
  const bookingConversationId = "seed-conversation-booking-1";
  const bookingId = "seed-booking-1";
  const bookingMessageId = "seed-message-booking-1";
  const bookingStartDate = new Date("2030-06-01T00:00:00.000Z");
  const bookingEndDate = new Date("2030-06-04T00:00:00.000Z");

  await prisma.messageAttachment.deleteMany({ where: { id: { startsWith: "seed-attachment-" } } });
  await prisma.message.deleteMany({ where: { id: { startsWith: "seed-message-" } } });
  await prisma.$executeRawUnsafe('ALTER TABLE "BookingStatusHistory" DISABLE TRIGGER booking_status_history_immutable');
  await prisma.bookingStatusHistory.deleteMany({ where: { bookingId } });
  await prisma.$executeRawUnsafe('ALTER TABLE "BookingStatusHistory" ENABLE TRIGGER booking_status_history_immutable');
  await prisma.conversationParticipant.deleteMany({ where: { conversationId: bookingConversationId } });
  await prisma.booking.deleteMany({ where: { id: bookingId } });
  await prisma.conversation.deleteMany({ where: { id: bookingConversationId } });

  await prisma.conversation.create({
    data: {
      id: bookingConversationId,
      listingId: bookingListingId,
      participants: {
        create: [{ userId: bookingOwnerId }, { userId: bookingRenterId }],
      },
    },
  });

  await prisma.booking.create({
    data: {
      id: bookingId,
      listingId: bookingListingId,
      renterId: bookingRenterId,
      ownerId: bookingOwnerId,
      conversationId: bookingConversationId,
      startDate: bookingStartDate,
      endDate: bookingEndDate,
      status: "pending",
      pricePerDay: 10,
      totalDays: 3,
      subtotal: 30,
      serviceFee: 3,
      totalPrice: 33,
      currencyCode: "EUR",
      idempotencyKey: "seed-booking-request-1",
      statusHistory: {
        create: {
          fromStatus: null,
          toStatus: "pending",
          changedById: bookingRenterId,
          reason: "Solicitud de prueba",
        },
      },
    },
  });

  await prisma.message.create({
    data: {
      id: bookingMessageId,
      conversationId: bookingConversationId,
      senderId: bookingRenterId,
      clientMessageId: "seed-client-message-booking-1",
      type: "text",
      body: "Hola, me interesa reservar este producto.",
      attachments: {
        create: {
          id: "seed-attachment-booking-1",
          type: "image",
          storageKey: "seed/bookings/booking-1/example.jpg",
          publicUrl: "https://example.com/seed/booking-1/example.jpg",
          mimeType: "image/jpeg",
          byteSize: 1024,
          width: 800,
          height: 600,
          checksum: "seed-checksum-booking-1",
        },
      },
    },
  });

  // eslint-disable-next-line no-console
  console.log(`Seed completada: ${categoryGroups.length} categorías padre y ${categoryGroups.reduce((total, group) => total + group.children.length, 0)} subcategorías, ${listingIndex} listings de ejemplo, 10 listings para test@test.com y 1 reserva de prueba con conversación.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
