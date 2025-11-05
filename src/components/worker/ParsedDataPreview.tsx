import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle, Info, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";

interface ParsedDataPreviewProps {
  parsedData: any;
  onApply: (editedData: any) => void;
  onCancel: () => void;
}

export const ParsedDataPreview = ({ parsedData, onApply, onCancel }: ParsedDataPreviewProps) => {
  const [editedData, setEditedData] = useState(parsedData);

  const getConfidenceBadge = () => {
    const confidence = parsedData.confidence || 'medium';
    const variants: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
      high: 'default',
      medium: 'secondary',
      low: 'destructive'
    };
    return (
      <Badge variant={variants[confidence]}>
        {confidence.toUpperCase()} confidence
      </Badge>
    );
  };

  const updatePersonalInfo = (field: string, value: string) => {
    setEditedData({
      ...editedData,
      personal_info: { ...editedData.personal_info, [field]: value }
    });
  };

  const updateLocation = (field: string, value: string) => {
    setEditedData({
      ...editedData,
      location: { ...editedData.location, [field]: value }
    });
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader className="sticky top-0 bg-card z-10 border-b">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Review Parsed Resume Data
                {getConfidenceBadge()}
              </CardTitle>
              <CardDescription>
                Review and edit the information extracted from your resume before applying
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* Warnings */}
          {parsedData.warnings && parsedData.warnings.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-semibold mb-2">Extraction Warnings:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {parsedData.warnings.map((warning: string, idx: number) => (
                    <li key={idx}>{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Personal Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>First Name</Label>
                <Input
                  value={editedData.personal_info?.first_name || ''}
                  onChange={(e) => updatePersonalInfo('first_name', e.target.value)}
                  placeholder="Not found"
                />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input
                  value={editedData.personal_info?.last_name || ''}
                  onChange={(e) => updatePersonalInfo('last_name', e.target.value)}
                  placeholder="Not found"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editedData.personal_info?.email || ''}
                  onChange={(e) => updatePersonalInfo('email', e.target.value)}
                  placeholder="Not found"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={editedData.personal_info?.phone || ''}
                  onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                  placeholder="Not found"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          {(editedData.location?.address || editedData.location?.pincode) && (
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Info className="h-4 w-4" />
                Location
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Address</Label>
                  <Textarea
                    value={editedData.location?.address || ''}
                    onChange={(e) => updateLocation('address', e.target.value)}
                    placeholder="Not found"
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Pincode</Label>
                  <Input
                    value={editedData.location?.pincode || ''}
                    onChange={(e) => updateLocation('pincode', e.target.value)}
                    placeholder="Not found"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Skills */}
          {editedData.skills && editedData.skills.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Skills ({editedData.skills.length})</h3>
              <div className="flex flex-wrap gap-2">
                {editedData.skills.map((skill: string, idx: number) => (
                  <Badge key={idx} variant="outline">{skill}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Previous Work */}
          {editedData.previous_works && editedData.previous_works.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Previous Work Experience ({editedData.previous_works.length})</h3>
              <div className="space-y-3">
                {editedData.previous_works.map((work: any, idx: number) => (
                  <Card key={idx}>
                    <CardContent className="pt-4">
                      <p className="font-semibold">{work.job_title}</p>
                      <p className="text-sm text-muted-foreground">{work.company_name}</p>
                      <p className="text-sm">{work.duration}</p>
                      {work.location && <p className="text-sm">{work.location}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Extraction Metadata */}
          {parsedData.extraction_metadata && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Text Quality: {parsedData.extraction_metadata.text_quality} • 
                Extracted {parsedData.extraction_metadata.text_length} characters
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 sticky bottom-0 bg-card border-t -mx-6 px-6 py-4">
            <Button onClick={() => onApply(editedData)} className="flex-1">
              Apply to Profile
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
