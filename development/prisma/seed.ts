import { PrismaClient } from "@prisma/client";

/**
 * Semilla mínima y determinista (TESTING.md §6).
 * No depende de datos reales ni de red; idempotente en contenido.
 * Incluye listings de ejemplo para 004-public-search.
 */
const prisma = new PrismaClient();

async function main() {
  const categories = [
    { name: "Electrónica", slug: "electronica", showInNav: true },
    { name: "Herramientas", slug: "herramientas", showInNav: true },
    { name: "Deporte y aire libre", slug: "deporte-aire-libre", showInNav: true },
    { name: "Cámaras y foto", slug: "camaras-y-foto", showInNav: true },
    { name: "Audio", slug: "audio", showInNav: true },
    { name: "Vehículos", slug: "vehiculos", showInNav: true },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
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

  const electronicsCat = await prisma.category.findUniqueOrThrow({ where: { slug: "electronica" } });
  const toolsCat = await prisma.category.findUniqueOrThrow({ where: { slug: "herramientas" } });
  const sportCat = await prisma.category.findUniqueOrThrow({ where: { slug: "deporte-aire-libre" } });
  const camerasCat = await prisma.category.findUniqueOrThrow({ where: { slug: "camaras-y-foto" } });
  const audioCat = await prisma.category.findUniqueOrThrow({ where: { slug: "audio" } });
  const vehiclesCat = await prisma.category.findUniqueOrThrow({ where: { slug: "vehiculos" } });

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
    { title: "Proyector Full HD", category: electronicsCat, pricePerDay: 35 },
    { title: "Portátil gaming", category: electronicsCat, pricePerDay: 50 },
    { title: "Monitor 27\" 4K", category: electronicsCat, pricePerDay: 25 },
    { title: "Consola de última generación", category: electronicsCat, pricePerDay: 30 },
    { title: "Set de iluminación LED", category: electronicsCat, pricePerDay: 28 },
    { title: "Escáner 3D portátil", category: electronicsCat, pricePerDay: 70 },
    { title: "Impresora 3D", category: electronicsCat, pricePerDay: 40 },
    { title: "Robot aspirador", category: electronicsCat, pricePerDay: 12 },
    { title: "Freidora de aire XL", category: electronicsCat, pricePerDay: 8 },
    { title: "Pantalla LED 100 pulgadas", category: electronicsCat, pricePerDay: 90 },
    { title: "Mini PC silencioso", category: electronicsCat, pricePerDay: 22 },
    { title: "Tablet gráfica profesional", category: electronicsCat, pricePerDay: 18 },
    { title: "Router WiFi 6 mesh", category: electronicsCat, pricePerDay: 8 },
    { title: "Cámara de videovigilancia 4K", category: electronicsCat, pricePerDay: 10 },
    { title: "Disco duro externo 4TB", category: electronicsCat, pricePerDay: 5 },
    { title: "Auriculares VR todo-en-uno", category: electronicsCat, pricePerDay: 35 },
    { title: "Teclado mecánico RGB", category: electronicsCat, pricePerDay: 10 },
    { title: "Hub USB-C 12 en 1", category: electronicsCat, pricePerDay: 5 },
    { title: "Cargador solar portátil", category: electronicsCat, pricePerDay: 6 },
    { title: "Proyector láser 4K ultra-corta", category: electronicsCat, pricePerDay: 150 },

    // ── Herramientas (16) ──
    { title: "Taladro percusión profesional", category: toolsCat, pricePerDay: 12 },
    { title: "Andamio modular 2m", category: toolsCat, pricePerDay: 20 },
    { title: "Compresor de aire 50L", category: toolsCat, pricePerDay: 18 },
    { title: "Sierra circular", category: toolsCat, pricePerDay: 15 },
    { title: "Máquina de coser", category: toolsCat, pricePerDay: 14 },
    { title: "Hidrolimpiadora", category: toolsCat, pricePerDay: 22 },
    { title: "Caja de herramientas completa", category: toolsCat, pricePerDay: 16 },
    { title: "Amoladora angular 230mm", category: toolsCat, pricePerDay: 10 },
    { title: "Soldadora inverter MMA", category: toolsCat, pricePerDay: 25 },
    { title: "Carretilla reforzada 200L", category: toolsCat, pricePerDay: 8 },
    { title: "Andamio de aluminio 6m", category: toolsCat, pricePerDay: 45 },
    { title: "Pulidora de paredes", category: toolsCat, pricePerDay: 18 },
    { title: "Detector de tuberías y cables", category: toolsCat, pricePerDay: 7 },
    { title: "Martillo demoledor eléctrico", category: toolsCat, pricePerDay: 30 },
    { title: "Set de brocas para mampostería", category: toolsCat, pricePerDay: 5 },
    { title: "Generador eléctrico 3kW", category: toolsCat, pricePerDay: 35 },

    // ── Deporte y aire libre (18) ──
    { title: "Bicicleta de montaña", category: sportCat, pricePerDay: 22 },
    { title: "Kayak inflable", category: sportCat, pricePerDay: 28 },
    { title: "Tabla de paddle surf", category: sportCat, pricePerDay: 25 },
    { title: "Casetas de campaña 4 plazas", category: sportCat, pricePerDay: 16 },
    { title: "Equipo de escalada completo", category: sportCat, pricePerDay: 40 },
    { title: "Tabla de snowboard", category: sportCat, pricePerDay: 26 },
    { title: "Raquetas de tenis", category: sportCat, pricePerDay: 10 },
    { title: "Set de palas de pádel", category: sportCat, pricePerDay: 12 },
    { title: "Bicicleta de carretera carbono", category: sportCat, pricePerDay: 45 },
    { title: "Saco de dormir -10°C", category: sportCat, pricePerDay: 8 },
    { title: "Canoa para 2 personas", category: sportCat, pricePerDay: 30 },
    { title: "Equipo completo de buceo", category: sportCat, pricePerDay: 55 },
    { title: "Tabla de surf 6'2\"", category: sportCat, pricePerDay: 20 },
    { title: "Botas de trekking impermeables", category: sportCat, pricePerDay: 7 },
    { title: "Mochila de expedición 60L", category: sportCat, pricePerDay: 6 },
    { title: "Estación meteorológica portátil", category: sportCat, pricePerDay: 9 },
    { title: "Set de pesca con caña y carrete", category: sportCat, pricePerDay: 14 },
    { title: "Trineo de plástico para nieve", category: sportCat, pricePerDay: 5 },

    // ── Vehículos (16) ──
    { title: "Patinete eléctrico", category: vehiclesCat, pricePerDay: 20 },
    { title: "Bicicleta eléctrica plegable", category: vehiclesCat, pricePerDay: 30 },
    { title: "Remolque de carga", category: vehiclesCat, pricePerDay: 35 },
    { title: "Furgoneta camper", category: vehiclesCat, pricePerDay: 95 },
    { title: "Coche clásico para eventos", category: vehiclesCat, pricePerDay: 150 },
    { title: "Moto scooter 125cc", category: vehiclesCat, pricePerDay: 40 },
    { title: "Quad 250cc off-road", category: vehiclesCat, pricePerDay: 60 },
    { title: "Furgoneta de mudanza 3.5T", category: vehiclesCat, pricePerDay: 70 },
    { title: "Bicicleta tandem", category: vehiclesCat, pricePerDay: 18 },
    { title: "Remolque porta-motos", category: vehiclesCat, pricePerDay: 25 },
    { title: "Monociclo eléctrico", category: vehiclesCat, pricePerDay: 22 },
    { title: "Patinete eléctrico de asiento", category: vehiclesCat, pricePerDay: 28 },
    { title: "Furgoneta refrigerada", category: vehiclesCat, pricePerDay: 85 },
    { title: "Coche eléctrico largo alcance", category: vehiclesCat, pricePerDay: 75 },
    { title: "Moto de trail 500cc", category: vehiclesCat, pricePerDay: 55 },
    { title: "Ciclomotor clásico restaurado", category: vehiclesCat, pricePerDay: 35 },
  ];

  // Generar 100 listings distribuidos en ciudades y arrendadores
  let listingIndex = 0;
  for (const template of listingTemplates) {
    const city = cities[listingIndex % cities.length]!;
    const ownerId = ownerIds[listingIndex % ownerIds.length]!;
    const rating = 3.5 + ((listingIndex * 7) % 16) / 10; // 3.5 a 5.0
    const reviewCount = (listingIndex * 3 + 1) % 50;
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

    // Foto principal para cada listing (picsum.photos: imágenes estables por ID)
    const photoId = `seed-photo-${listingIndex}`;
    const photoUrl = `https://picsum.photos/seed/toolyo-${listingIndex}/800/600`;
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

  // eslint-disable-next-line no-console
  console.log(`Seed completada: ${categories.length} categorías, ${listingIndex} listings de ejemplo.`);
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
