import {PropsWithChildren} from "react";
import {Navbar} from "@/components/navbar.tsx";
import {PoweredBySignum} from "@/components/powered-by-signum.tsx";

export function PageContent({children}: PropsWithChildren) {
    return (
        <div className="min-h-screen bg-background">
            <Navbar/>
            {children}
            <PoweredBySignum />
        </div>
    )
}
