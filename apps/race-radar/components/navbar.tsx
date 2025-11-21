import Link from "next/link"
import {ThemeSwitcher} from "./theme-switcher"
import {Logo} from "./logo";

export function Navbar() {
    return (
        <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <Logo  priority className={"sm:h-14 sm:w-14 h-10 w-10"} />
                        <div className="hidden sm:block">
                            <div className="font-bold text-xl text-foreground">
                                ER1P <span className="text-primary">Race Radar</span>
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">Every Race in One Place</div>
                        </div>
                    </Link>

                    <div className="flex items-center gap-6">
                        <Link
                            href="/"
                            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Live Races
                        </Link>
                        <Link
                            href="/history"
                            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            History
                        </Link>
                        <Link
                            href="/runners"
                            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Runners
                        </Link>
                        <div className="ml-2">
                            <ThemeSwitcher/>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    )
}
