# LabCare API test script. Run from PowerShell while the backend is running:
#   cd E:\LabCare\tests
#   powershell -ExecutionPolicy Bypass -File .\test_api.ps1
# Before running: check allowed role + priority values with sql/00_inspect.sql (query 2)
# and change these 3 values if your database uses different words.
$base       = "http://localhost:5000"
$TECH_ROLE  = "TECHNICIAN"
$ADMIN_ROLE = "ADMIN"
$PRIORITY   = "HIGH"

function Call($method, $path, $body = $null) {
    Write-Host "`n=== $method $path" -ForegroundColor Cyan
    try {
        if ($body) {
            $json = $body | ConvertTo-Json
            $r = Invoke-RestMethod -Method $method -Uri "$base$path" -ContentType "application/json" -Body $json
        } else {
            $r = Invoke-RestMethod -Method $method -Uri "$base$path"
        }
        $r | ConvertTo-Json -Depth 6
        return $r
    } catch {
        Write-Host "ERROR:" -ForegroundColor Red
        if ($_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message -ForegroundColor Red } else { Write-Host $_.Exception.Message -ForegroundColor Red }
        return $null
    }
}

Call GET "/"

# ---- USERS (reuse if they already exist) ----
$t = Call GET "/api/users?email=tech@labcare.com"
if ($t.count -eq 0) { $t = Call POST "/api/users" @{ name="Tech One"; email="tech@labcare.com"; phone="9000000001"; role=$TECH_ROLE; department="Maintenance" }; $techId = $t.data.user_id } else { $techId = $t.data[0].user_id }
$a = Call GET "/api/users?email=admin@labcare.com"
if ($a.count -eq 0) { $a = Call POST "/api/users" @{ name="Admin One"; email="admin@labcare.com"; phone="9000000002"; role=$ADMIN_ROLE; department="Administration" }; $adminId = $a.data.user_id } else { $adminId = $a.data[0].user_id }
Write-Host "technician id = $techId, admin id = $adminId" -ForegroundColor Yellow

# ---- READ the existing sample data ----
Call GET "/api/labs"
Call GET "/api/categories"
Call GET "/api/equipment/details"
$eq = (Call GET "/api/equipment?asset_tag=LAB-TEST-001").data[0]

# ---- CRUD on lab (create / update / delete) ----
$lab = Call POST "/api/labs" @{ lab_name="Temp Lab"; building="Block Z"; floor=1; capacity=10 }
if ($lab) { Call PUT "/api/labs/$($lab.data.lab_id)" @{ capacity=25 }; Call DELETE "/api/labs/$($lab.data.lab_id)" }

# ---- FULL WORKFLOW (triggers + functions) ----
# Make sure the desktop is WORKING first, so you can see the triggers change it
Call PATCH "/api/equipment/$($eq.equipment_id)/status" @{ status="WORKING" }

$c = Call POST "/api/complaints" @{ equipment_id=$eq.equipment_id; user_id=1; issue_type="HARDWARE"; description="Screen not turning on"; priority=$PRIORITY }
$cid = $c.data.complaint_id
Write-Host "Equipment should now be FAULTY (trigger):" -ForegroundColor Yellow
(Call GET "/api/equipment/$($eq.equipment_id)").data.status

Call GET "/api/complaints/pending"

$asg = Call POST "/api/assignments" @{ complaint_id=$cid; technician_id=$techId; assigned_by=$adminId }
$aid = $asg.data.assignment_id
Write-Host "Complaint should now be ASSIGNED (trigger):" -ForegroundColor Yellow
(Call GET "/api/complaints/$cid").data.status

Call POST "/api/assignments" @{ complaint_id=$cid; technician_id=$techId; assigned_by=$adminId }   # must FAIL (already assigned)
Call POST "/api/assignments" @{ complaint_id=$cid; technician_id=999999; assigned_by=$adminId }    # must FAIL

Call GET "/api/assignments/details"

# Technician starts the repair -> complaint IN_PROGRESS, equipment UNDER_REPAIR, maintenance log entry (triggers)
Call POST "/api/repairs" @{ complaint_id=$cid; technician_id=$adminId; repair_description="x" }   # must FAIL (admin is not a TECHNICIAN)
$rep = Call POST "/api/repairs" @{ complaint_id=$cid; technician_id=$techId; repair_description="Replacing monitor cable" }
$rid = $rep.data.repair_id
Write-Host "Complaint IN_PROGRESS / equipment UNDER_REPAIR:" -ForegroundColor Yellow
(Call GET "/api/complaints/$cid").data.status
(Call GET "/api/equipment/$($eq.equipment_id)").data.status

# Finish the repair -> assignment COMPLETED, complaint RESOLVED, equipment WORKING
Call POST "/api/repairs/$rid/complete" @{ repair_description="Cable replaced"; repair_cost=250.50 }
Call POST "/api/repairs/$rid/complete"        # must FAIL (already completed)
Write-Host "Complaint RESOLVED + equipment WORKING:" -ForegroundColor Yellow
(Call GET "/api/complaints/$cid").data.status
(Call GET "/api/equipment/$($eq.equipment_id)").data.status

Call GET "/api/repairs/history"
Call GET "/api/maintenance/details?equipment_id=$($eq.equipment_id)"

# ---- REPORTS ----
Call GET "/api/reports/dashboard"
Call GET "/api/reports/complaint-summary"
Call GET "/api/reports/equipment-status"
Call GET "/api/reports/lab-report"
Call GET "/api/reports/repair-cost"

# ---- Invalid operations (all must show errors) ----
Call POST "/api/labs" @{ lab_name="Bad"; capacity=-1 }                          # CHECK
Call PATCH "/api/equipment/$($eq.equipment_id)/status" @{ status="BROKEN" }     # invalid status
Write-Host "`nDONE" -ForegroundColor Green
