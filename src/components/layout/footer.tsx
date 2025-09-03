import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t bg-card">
      <div className="container mx-auto py-6 px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-center md:text-left text-sm text-muted-foreground">
          © {new Date().getFullYear()} E-Ventless. All rights reserved.
        </p>
        <div className="flex gap-4">
            <Link href="/contact-support" className="text-sm text-muted-foreground hover:text-primary">
                Contact Support
            </Link>
        </div>
      </div>
    </footer>
  );
}
