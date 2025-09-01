
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QrCode, Ticket, UserCheck, XCircle, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsQR from "jsqr";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import type { Ticket as TicketType } from "@/types";
import { format } from "date-fns";

type TicketStatus = "valid" | "used" | "invalid" | "loading";

type ScannedTicketInfo = {
    status: TicketStatus;
    id: string;
    eventName: string;
    attendee: string; // This would be fetched in a real scenario
}

export default function CheckInPage() {
  const [scannedData, setScannedData] = useState<ScannedTicketInfo | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isScanning) {
      const getCameraPermission = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
          setHasCameraPermission(true);

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error("Error accessing camera:", error);
          setHasCameraPermission(false);
          toast({
            variant: "destructive",
            title: "Camera Access Denied",
            description: "Please enable camera permissions in your browser settings to scan tickets.",
          });
          setIsScanning(false); // Stop scanning if permission is denied
        }
      };
      getCameraPermission();
    } else {
        // Stop camera stream when not scanning
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    }
  }, [isScanning, toast]);

  useEffect(() => {
    let animationFrameId: number;

    const scan = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const context = canvas.getContext("2d");

        if (context) {
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code) {
            handleQrCodeScanned(code.data);
            setIsScanning(false); // Stop scanning after a code is found
          }
        }
      }
      animationFrameId = requestAnimationFrame(scan);
    };

    if (isScanning && hasCameraPermission) {
      animationFrameId = requestAnimationFrame(scan);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isScanning, hasCameraPermission]);
  
  const handleQrCodeScanned = async (ticketId: string) => {
    setScannedData({ status: 'loading', id: ticketId, eventName: '...', attendee: '...' });
    
    try {
        const ticketRef = doc(firestore, "tickets", ticketId);
        const ticketSnap = await getDoc(ticketRef);

        if (!ticketSnap.exists()) {
            setScannedData({ status: 'invalid', id: ticketId, eventName: "N/A", attendee: "N/A" });
            return;
        }

        const ticketData = ticketSnap.data() as TicketType;
        
        // TODO: Fetch user name from users collection using ticketData.userId for attendee name
        
        if (ticketData.status === 'used') {
            setScannedData({ status: 'used', id: ticketId, eventName: ticketData.eventDetails?.title ?? "Event", attendee: "Fetched Name" });
        } else {
             setScannedData({ status: 'valid', id: ticketId, eventName: ticketData.eventDetails?.title ?? "Event", attendee: "Fetched Name" });
        }

    } catch (error) {
        console.error("Error validating ticket:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not validate ticket.'});
        setScannedData(null);
    }
  };

  const handleConfirmCheckin = async () => {
    if (!scannedData || scannedData.status !== 'valid') return;

    try {
        const ticketRef = doc(firestore, "tickets", scannedData.id);
        await updateDoc(ticketRef, { status: 'used' });
        setScannedData({ ...scannedData, status: 'used' });
         toast({ title: 'Success', description: 'Check-in confirmed.' });
    } catch(error) {
        console.error("Error confirming check-in:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not confirm check-in.'});
    }
  };

  const handleReset = () => {
    setScannedData(null);
    setIsScanning(false);
  };
  
  const getStatusInfo = (status: TicketStatus) => {
    switch (status) {
      case "loading":
        return { text: "Verifying...", color: "text-blue-600", icon: <QrCode className="h-8 w-8 animate-pulse" /> };
      case "valid":
        return { text: "Ticket Valid", color: "text-green-600", icon: <UserCheck className="h-8 w-8" /> };
      case "used":
        return { text: "Already Used", color: "text-yellow-600", icon: <Ticket className="h-8 w-8" /> };
      case "invalid":
        return { text: "Ticket Invalid", color: "text-red-600", icon: <XCircle className="h-8 w-8" /> };
    }
  };

  const statusInfo = scannedData ? getStatusInfo(scannedData.status) : null;

  return (
    <div className="container mx-auto max-w-md py-12 px-4 flex flex-col items-center text-center">
      <h1 className="text-4xl font-bold font-headline mb-2">Event Check-in</h1>
      <p className="text-muted-foreground mb-8">
        Scan attendee tickets to validate and process entry.
      </p>
      
       <canvas ref={canvasRef} className="hidden" />

      {!scannedData ? (
        <Card className="w-full shadow-lg">
          <CardContent className="p-8 flex flex-col items-center justify-center">
            {isScanning ? (
                <div className="w-full">
                    <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay playsInline muted />
                    {hasCameraPermission === false && (
                         <Alert variant="destructive" className="mt-4 text-left">
                            <AlertTitle>Camera Access Required</AlertTitle>
                            <AlertDescription>
                                Please allow camera access in your browser settings to use this feature.
                            </AlertDescription>
                        </Alert>
                    )}
                    <Button size="lg" variant="outline" className="w-full mt-4" onClick={() => setIsScanning(false)}>
                        Cancel Scan
                    </Button>
                </div>
            ) : (
                <>
                    <Camera className="h-24 w-24 text-muted-foreground mb-6" />
                    <Button size="lg" className="w-full" onClick={() => setIsScanning(true)}>
                    <QrCode className="mr-2 h-5 w-5" />
                    Scan Ticket
                    </Button>
                    <p className="text-sm text-muted-foreground mt-4">
                    Use your device's camera to scan the QR code on the ticket.
                    </p>
                </>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full shadow-xl animate-in fade-in-50 zoom-in-95">
          <CardHeader className="items-center">
            {statusInfo && (
              <>
                <div className={`p-4 rounded-full bg-background ${statusInfo.color}`}>
                  {statusInfo.icon}
                </div>
                <CardTitle className={`font-headline text-2xl ${statusInfo.color}`}>
                  {statusInfo.text}
                </CardTitle>
              </>
            )}
          </CardHeader>
          <CardContent className="space-y-4 text-left">
            <div className="border-t pt-4">
              <p className="text-sm font-semibold text-muted-foreground">Ticket ID</p>
              <p className="font-mono break-all">{scannedData.id}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Event</p>
              <p>{scannedData.eventName}</p>
            </div>
             <div>
              <p className="text-sm font-semibold text-muted-foreground">Attendee</p>
              <p>{scannedData.attendee}</p>
            </div>

            {scannedData.status === "valid" && (
               <Button size="lg" className="w-full mt-4 bg-green-600 hover:bg-green-700" onClick={handleConfirmCheckin}>
                Confirm Check-in
              </Button>
            )}
            <Button size="lg" variant="outline" className="w-full" onClick={handleReset}>
              Scan Next Ticket
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

    