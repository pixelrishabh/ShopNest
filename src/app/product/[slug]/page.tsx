import { notFound } from "next/navigation";
import { Metadata } from "next";
import { db } from "@/lib/db";
import { ProductDetailView } from "@/components/product/ProductDetailView";

interface ProductPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await db.product.findUnique({
    where: { slug: params.slug },
    select: { name: true, description: true, brand: true },
  });

  if (!product) {
    return { title: "Product Not Found | ShopNest" };
  }

  return {
    title: `${product.name} - Buy Online at Best Price in India | ShopNest`,
    description: product.description.slice(0, 160),
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await db.product.findUnique({
    where: { slug: params.slug },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images: { orderBy: { displayOrder: "asc" } },
      variants: { orderBy: { price: "asc" } },
      reviews: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!product || !product.isPublished) {
    notFound();
  }

  // Related products in the same category
  const relatedProducts = await db.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: product.id },
      isPublished: true,
    },
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      variants: { take: 1 },
    },
    take: 4,
  });

  return <ProductDetailView product={product as any} relatedProducts={relatedProducts} />;
}
