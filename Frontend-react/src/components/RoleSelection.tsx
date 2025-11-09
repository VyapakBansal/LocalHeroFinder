import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Check, Loader2, Upload, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RoleSelectionProps {
  onBack: () => void;
}

interface CertificationFile {
  file: File;
  name: string;
  type: string;
}

const RoleSelection = ({ onBack }: RoleSelectionProps) => {
  const navigate = useNavigate();
  const [view, setView] = useState<"select" | "responder-form">("select");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [certificationFiles, setCertificationFiles] = useState<CertificationFile[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const availableSkills = [
    "CPR Certified",
    "First Aid",
    "AED Trained",
    "EMT",
    "Paramedic",
    "Nurse",
    "Doctor",
    "Firefighter",
  ];

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : [...prev, skill]
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum size is 10MB.`);
        return;
      }

      setCertificationFiles((prev) => [
        ...prev,
        {
          file,
          name: file.name,
          type: file.type,
        },
      ]);
    });
  };

  const removeFile = (index: number) => {
    setCertificationFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadCertifications = async (userId: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    let uploadErrors = 0;

    for (const certFile of certificationFiles) {
      try {
        const fileExt = certFile.file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('certifications')
          .upload(fileName, certFile.file, {
            upsert: false
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          uploadErrors++;
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('certifications')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      } catch (error) {
        console.error("Upload error:", error);
        uploadErrors++;
      }
    }

    if (uploadErrors > 0 && uploadedUrls.length === 0) {
      toast.warning(`Could not upload files (storage may not be configured). Submitting application without documentation.`);
    } else if (uploadErrors > 0) {
      toast.warning(`Some files failed to upload. Submitted with ${uploadedUrls.length} of ${certificationFiles.length} files.`);
    }

    return uploadedUrls;
  };

    const handleResponderSubmit = async () => {
    if (!agreedToTerms) {
      toast.error("Please agree to the terms and conditions");
      return;
    }

    if (selectedSkills.length === 0) {
      toast.error("Please select at least one skill");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please sign in first");
        navigate("/auth");
        return;
      }

      let certificationUrls: string[] = [];
      if (certificationFiles.length > 0) {
        try {
          certificationUrls = await uploadCertifications(user.id);
        } catch (error) {
          console.error("Upload process error:", error);
          toast.warning("File upload had issues, but continuing with application submission.");
        }
      }

      const certifications = certificationUrls.length > 0 
        ? certificationUrls.map((url, index) => {
            return {
              name: certificationFiles[index]?.name || `Certification ${index + 1}`,
              url: url,
              uploadedAt: new Date().toISOString(),
            };
          })
        : null;

      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "responder")
        .maybeSingle();

      if (!existingRole) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({ user_id: user.id, role: "responder" });

        if (roleError) {
          const isDuplicateError = roleError.code === "23505" || 
                                   roleError.message?.toLowerCase().includes("duplicate") ||
                                   roleError.message?.toLowerCase().includes("unique");
          
          if (!isDuplicateError) {
            toast.error("Failed to add responder role. You may need admin assistance.");
            console.error("Role error:", roleError);
            setLoading(false);
            return;
          }
        }
      }

      const { error: profileError } = await supabase
        .from("responder_profiles")
        .upsert({
          user_id: user.id,
          skills: selectedSkills,
          certifications: certifications,
          verification_status: "verified",
        });

      if (profileError) {
        toast.error("Failed to create responder profile");
        console.error("Profile error:", profileError);
        setLoading(false);
        return;
      }

      toast.success("Application submitted! Redirecting to dashboard...");
      navigate("/dashboard");
    } catch (error) {
      toast.error("Something went wrong");
      console.error("Error:", error);
      setLoading(false);
    }
  };

  if (view === "responder-form") {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => setView("select")}
            className="mb-8 hover:bg-muted rounded-xl"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Card className="p-8 rounded-2xl shadow-xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Responder Application
              </h2>
              <p className="text-muted-foreground">
                Select your skills and certifications
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">
                  Select Your Skills
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableSkills.map((skill) => (
                    <Badge
                      key={skill}
                      variant={selectedSkills.includes(skill) ? "default" : "outline"}
                      className="cursor-pointer px-4 py-2 text-sm rounded-xl transition-all"
                      onClick={() => toggleSkill(skill)}
                    >
                      {selectedSkills.includes(skill) && (
                        <Check className="w-3 h-3 mr-1" />
                      )}
                      {skill}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Select at least one skill
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">
                  Upload Certifications/Documentation (Optional)
                </label>
                <div className="space-y-2">
                  <div className="flex items-center justify-center w-full">
                    <label
                      htmlFor="cert-upload"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">PDF, PNG, JPG (MAX. 10MB each)</p>
                      </div>
                      <input
                        id="cert-upload"
                        type="file"
                        className="hidden"
                        multiple
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>
                  {certificationFiles.length > 0 && (
                    <div className="space-y-2">
                      {certificationFiles.map((certFile, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-accent/10 rounded-lg border border-accent/20"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-foreground truncate max-w-xs">
                              {certFile.name}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="h-8 w-8 p-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="terms"
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label htmlFor="terms" className="text-sm font-medium text-foreground cursor-pointer">
                      I agree to the Terms and Conditions
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      By checking this box, I acknowledge that I understand the responsibilities and risks associated with being a responder. I agree to provide accurate information about my skills and certifications, and I understand that my application will be reviewed before I can respond to emergencies.
                    </p>
                  </div>
                </div>
                <p className="text-sm text-foreground">
                  <strong>Note:</strong> Your account will be marked as "pending verification" until an admin reviews your application and documentation.
                </p>
              </div>

              <Button
                size="lg"
                onClick={handleResponderSubmit}
                disabled={loading || selectedSkills.length === 0 || !agreedToTerms}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-6 rounded-xl shadow-lg font-bold"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Submit for Verification
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-8 hover:bg-muted rounded-xl"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Become a Responder
          </h1>
          <p className="text-xl text-muted-foreground">
            Use your skills to help save lives in your community
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-4">
          <Button
            size="lg"
            onClick={() => setView("responder-form")}
            className="w-full border-2 border-primary hover:bg-primary hover:text-primary-foreground text-lg py-7 rounded-xl font-semibold transition-all"
            variant="outline"
          >
            <Shield className="w-6 h-6 mr-2" />
            Apply as Responder
          </Button>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Already a requester? You can apply to become a responder anytime from your dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
