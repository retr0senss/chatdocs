"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApiSettings } from "@/components/settings/api-settings";
import { loadApiSettings, saveApiSettings, testApiSettings } from "@/lib/api-settings";
import type { ApiSettings as ApiSettingsType } from "@/components/settings/api-settings";
import { ArrowLeftIcon, SettingsIcon } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function SettingsPage() {
  const [apiSettings, setApiSettings] = useState<ApiSettingsType | null>(null);

  // Load settings
  useEffect(() => {
    const settings = loadApiSettings();
    setApiSettings(settings);
  }, []);

  // Update and save API settings
  const handleUpdateApiSettings = async (settings: ApiSettingsType) => {
    try {
      saveApiSettings(settings);
      setApiSettings(settings);
      toast.success("Settings saved");
    } catch (error) {
      toast.error("An error occurred while saving settings");
      console.error("Could not save settings:", error);
    }
  };

  // Test API connection
  const handleTestConnection = async () => {
    if (!apiSettings) return false;

    try {
      const result = await testApiSettings(apiSettings);
      return result;
    } catch (error) {
      console.error("Error during API test:", error);
      return false;
    }
  };

  if (!apiSettings) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center">
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center justify-center gap-6 max-w-2xl mx-auto">
        <div className="flex w-full items-center justify-between">
          <Button variant="outline" size="sm" asChild>
            <Link href="/chat">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Return to Home
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-center flex items-center">
            <SettingsIcon className="h-6 w-6 mr-2" />
            Settings
          </h1>
          <div className="w-[100px]"></div>
        </div>

        <div className="w-full">
          <ApiSettings
            settings={apiSettings}
            onUpdateSettings={handleUpdateApiSettings}
            onTestConnection={handleTestConnection}
          />
        </div>

        <div className="w-full">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Other Settings</CardTitle>
              <CardDescription>
                Manage other application settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Clear Cache</p>
                  <p className="text-sm text-muted-foreground">
                    Clears all downloaded model files and cache
                  </p>
                </div>
                <Button variant="outline" onClick={() => {
                  // IndexedDB and localStorage cleanup can be done here
                  toast.info("Clearing cache...");
                  if (typeof window !== "undefined" && window.caches) {
                    window.caches.keys().then(keyList => {
                      return Promise.all(keyList.map(key => {
                        return window.caches.delete(key);
                      }));
                    }).then(() => {
                      toast.success("Cache cleared");
                    });
                  }
                }}>
                  Clear Cache
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 