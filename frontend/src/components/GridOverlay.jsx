// src/components/GridOverlay.jsx
const GridOverlay = () => (
    <div className="absolute inset-0 pointer-events-none z-50 flex justify-center">
        <div className="w-full max-w-[1065px] grid grid-cols-12 gap-[15px] opacity-20 px-4">
            {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="bg-red-500/20"></div>
            ))}
        </div>
    </div>
);

export default GridOverlay;
