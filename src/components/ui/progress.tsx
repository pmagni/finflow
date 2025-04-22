import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

export interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  /**
   * Variante visual del componente Progress
   * @default "default"
   */
  variant?: "default" | "success" | "warning" | "danger" | "loading"
  
  /**
   * Marcadores para mostrar etapas específicas en la barra de progreso
   */
  markers?: number[]
  
  /**
   * Habilita animación de entrada
   * @default false
   */
  animate?: boolean
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ 
  className, 
  value, 
  variant = "default", 
  markers = [], 
  animate = false,
  ...props 
}, ref) => {
  // Determinar la clase CSS para el color según la variante
  const getVariantClass = () => {
    switch(variant) {
      case "success": return "bg-green-400";
      case "warning": return "bg-yellow-400";
      case "danger": return "bg-red-400";
      case "loading": return "bg-indigo-400";
      default: return "bg-primary";
    }
  };

  // Componente para los marcadores
  const Markers = () => {
    return (
      <>
        {markers.map((markerValue, index) => (
          <div 
            key={index}
            className="absolute top-0 h-full w-0.5 bg-white bg-opacity-50"
            style={{ left: `${markerValue}%` }}
          />
        ))}
      </>
    );
  };

  // Componente para el indicador con o sin animación
  const Indicator = () => {
    if (animate) {
      return (
        <motion.div
          className={cn("h-full w-full flex-1 transition-all", getVariantClass())}
          initial={{ transform: `translateX(-100%)` }}
          animate={{ transform: `translateX(-${100 - (value || 0)}%)` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      );
    }
    
    return (
      <ProgressPrimitive.Indicator
        className={cn("h-full w-full flex-1 transition-all", getVariantClass())}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    );
  };

  return (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
      {markers.length > 0 && <Markers />}
      <Indicator />
      
      {variant === "loading" && (
        <motion.div 
          className="absolute top-0 bottom-0 left-0 right-0 bg-white opacity-20"
          animate={{ 
            x: ["0%", "100%"],
            opacity: [0, 0.5, 0] 
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 1.5, 
            ease: "linear" 
          }}
    />
      )}
  </ProgressPrimitive.Root>
  );
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
