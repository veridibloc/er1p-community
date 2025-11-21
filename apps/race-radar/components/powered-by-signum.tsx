import Image from 'next/image'

export function PoweredBySignum() {

    return (
        <div className="fixed z-20 bottom-4 right-4 opacity-60 hover:opacity-100 transition-opacity">
            <a href="https://signum.network/" target="_blank" rel="noopener noreferrer">
                <Image src="/powered-by-signum.svg" alt="Powered by Signum" width={100} height={24}/>
            </a>
        </div>
    )

}
