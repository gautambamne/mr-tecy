import Image from "next/image"
import { Badge } from "@/components/ui/badge"

interface ServiceCardProps {
    title: string
    description: string
    image: string
    price?: string
    badge?: string
}

export function ServiceCard({ title, description, image, price, badge }: ServiceCardProps) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md hover:border-slate-300 transition-all group cursor-pointer">
            <div className="relative h-32 bg-slate-100">
                <Image
                    src={image}
                    alt={title}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {badge && (
                    <div className="absolute top-2 right-2">
                        <Badge variant="default" className="text-xs">{badge}</Badge>
                    </div>
                )}
            </div>
            <div className="p-3.5">
                <h3 className="font-semibold text-slate-950 text-sm mb-1">{title}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-2">{description}</p>
                {price && (
                    <p className="text-blue-600 font-semibold text-sm">From {price}</p>
                )}
            </div>
        </div>
    )
}
