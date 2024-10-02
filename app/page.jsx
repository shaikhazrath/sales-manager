'use client'
import FlickeringGrid from "@/components/ui/flickering-grid";
import HyperText from "@/components/ui/hyper-text";
import { RainbowButton } from "@/components/ui/rainbow-button";
import ShimmerButton from "@/components/ui/shimmer-button";
import { useRouter } from "next/navigation";
export default function Home() {
  const router = useRouter()

  return (
    <div className="relative h-screen w-full bg-white overflow-hidden ">
      <FlickeringGrid
        className="z-0 absolute inset-0 size-full"
        squareSize={4}
        gridGap={6}
        color="#6B7280"
        maxOpacity={0.5}
        flickerChance={0.1}
      />
      <div className="flex flex-col justify-center items-center h-screen">
        <HyperText
          className="text-xl md:text-8xl font-bold text-black"
          text="The AI Sales Engineer"
        />
        <div className="z-10 flex min-h-64 items-center justify-center">
        <RainbowButton onClick={()=>router.push('/salesrep')}> 
        Try Now
            </RainbowButton>;
        </div>
      </div>
    </div>
  );
}
