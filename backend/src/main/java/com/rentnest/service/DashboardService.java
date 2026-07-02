package com.rentnest.service;

import com.rentnest.exception.ResourceNotFoundException;
import com.rentnest.model.User;
import com.rentnest.model.dashboard.*;
import com.rentnest.repository.dashboard.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final DashboardPropertyRepository propertyRepo;
    private final DashboardUnitRepository unitRepo;
    private final DashboardLeaseRepository leaseRepo;
    private final RentRecordRepository rentRecordRepo;
    private final DashboardMaintenanceRepository maintenanceRepo;
    private final DashboardExpenditureRepository expenditureRepo;
    private final DashboardAnnouncementRepository announcementRepo;

    // ─── Stats ───────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Map<String, Object> getStats(User user) {
        UUID userId = user.getId();

        BigDecimal totalPaidRent = rentRecordRepo.sumPaidByUserId(userId);
        BigDecimal totalMaintenanceCost = maintenanceRepo.sumResolvedCostByUserId(userId);
        BigDecimal totalExpenditures = expenditureRepo.sumCostByUserId(userId);
        BigDecimal totalEarnings = totalPaidRent.subtract(totalMaintenanceCost).subtract(totalExpenditures);

        long totalUnits = unitRepo.countByUserId(userId);
        long occupiedUnits = unitRepo.countOccupiedByUserId(userId);
        long activeTenants = leaseRepo.countByUserId(userId);
        double occupancyRate = totalUnits > 0 ? (double) occupiedUnits / totalUnits * 100.0 : 0.0;

        long openMaintenance = maintenanceRepo.countOpenByUserId(userId);

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalEarnings", totalEarnings);
        stats.put("totalPaidRent", totalPaidRent);
        stats.put("totalMaintenanceCost", totalMaintenanceCost);
        stats.put("totalExpenditures", totalExpenditures);
        stats.put("activeTenants", activeTenants);
        stats.put("totalUnits", totalUnits);
        stats.put("occupiedUnits", occupiedUnits);
        stats.put("occupancyRate", Math.round(occupancyRate * 10.0) / 10.0);
        stats.put("openMaintenance", openMaintenance);

        return stats;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getChartData(User user) {
        UUID userId = user.getId();
        DateTimeFormatter monthFmt = DateTimeFormatter.ofPattern("MMMM yyyy", Locale.ENGLISH);

        // Collect rent payments by month
        List<RentRecord> allRecords = rentRecordRepo.findAllByUserId(userId);
        Map<String, BigDecimal> rentByMonth = new LinkedHashMap<>();
        Map<String, BigDecimal> feesByMonth = new LinkedHashMap<>();

        for (RentRecord r : allRecords) {
            if ("PAID".equals(r.getStatus()) && r.getPaidAt() != null) {
                String month = r.getPaidAt().format(monthFmt);
                rentByMonth.merge(month, r.getAmount(), BigDecimal::add);
            }
        }

        // Collect maintenance costs by resolved month
        List<DashboardMaintenanceRequest> resolvedMaint = maintenanceRepo.findResolvedWithCostByUserId(userId);
        for (DashboardMaintenanceRequest m : resolvedMaint) {
            if (m.getResolvedAt() != null) {
                String month = m.getResolvedAt().format(monthFmt);
                feesByMonth.merge(month, m.getCost(), BigDecimal::add);
            }
        }

        // Collect expenditures by month
        List<DashboardExpenditure> expenditures = expenditureRepo.findByUserIdOrderByCreatedAtDesc(userId);
        for (DashboardExpenditure e : expenditures) {
            if (e.getCreatedAt() != null) {
                String month = e.getCreatedAt().format(monthFmt);
                feesByMonth.merge(month, e.getCost(), BigDecimal::add);
            }
        }

        // Merge all months
        Set<String> allMonths = new LinkedHashSet<>();
        allMonths.addAll(rentByMonth.keySet());
        allMonths.addAll(feesByMonth.keySet());

        List<Map<String, Object>> chartData = new ArrayList<>();
        for (String month : allMonths) {
            BigDecimal rent = rentByMonth.getOrDefault(month, BigDecimal.ZERO);
            BigDecimal fees = feesByMonth.getOrDefault(month, BigDecimal.ZERO);
            Map<String, Object> point = new LinkedHashMap<>();
            point.put("month", month);
            point.put("rent", rent);
            point.put("fees", fees);
            point.put("net", rent.subtract(fees));
            chartData.add(point);
        }

        return chartData;
    }

    // ─── Properties ──────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<DashboardProperty> getProperties(User user) {
        return propertyRepo.findByUserIdOrderByCreatedAtDesc(user.getId());
    }

    @Transactional
    public DashboardProperty createProperty(User user, String name, String location, String type) {
        DashboardProperty property = DashboardProperty.builder()
                .user(user)
                .name(name)
                .location(location)
                .type(type)
                .build();
        return propertyRepo.save(property);
    }

    @Transactional
    public DashboardProperty updateProperty(UUID propertyId, User user, String name, String location, String type) {
        DashboardProperty property = propertyRepo.findById(propertyId)
                .orElseThrow(() -> new ResourceNotFoundException("Property not found"));
        verifyOwnership(property.getUser().getId(), user.getId());
        property.setName(name);
        property.setLocation(location);
        property.setType(type);
        return propertyRepo.save(property);
    }

    @Transactional
    public void deleteProperty(UUID propertyId, User user) {
        DashboardProperty property = propertyRepo.findById(propertyId)
                .orElseThrow(() -> new ResourceNotFoundException("Property not found"));
        verifyOwnership(property.getUser().getId(), user.getId());
        propertyRepo.delete(property);
    }

    // ─── Units ───────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<DashboardUnit> getUnits(UUID propertyId) {
        return unitRepo.findByProperty_IdOrderByCreatedAtAsc(propertyId);
        // return unitRepo.findByPropertyIdOrderByCreatedAtAsc(propertyId);
    }

    @Transactional(readOnly = true)
    public List<DashboardUnit> getAllUnits(User user) {
        return unitRepo.findAllByUserId(user.getId());
    }

    @Transactional
    public DashboardUnit createUnit(User user, UUID propertyId, String name, BigDecimal rentAmount, String rentPeriod, Integer collectionDay) {
        DashboardProperty property = propertyRepo.findById(propertyId)
                .orElseThrow(() -> new ResourceNotFoundException("Property not found"));
        verifyOwnership(property.getUser().getId(), user.getId());

        DashboardUnit unit = DashboardUnit.builder()
                .property(property)
                .name(name)
                .rentAmount(rentAmount)
                .rentPeriod(rentPeriod != null ? rentPeriod : "MONTHLY")
                .collectionDay(collectionDay != null ? collectionDay : 1)
                .isVacant(true)
                .build();
        return unitRepo.save(unit);
    }

    @Transactional
    public DashboardUnit updateUnit(UUID unitId, User user, String name, BigDecimal rentAmount, String rentPeriod, Integer collectionDay) {
        DashboardUnit unit = unitRepo.findById(unitId)
                .orElseThrow(() -> new ResourceNotFoundException("Unit not found"));
        verifyOwnership(unit.getProperty().getUser().getId(), user.getId());
        unit.setName(name);
        unit.setRentAmount(rentAmount);
        unit.setRentPeriod(rentPeriod != null ? rentPeriod : "MONTHLY");
        unit.setCollectionDay(collectionDay != null ? collectionDay : 1);
        return unitRepo.save(unit);
    }

    @Transactional
    public void deleteUnit(UUID unitId, User user) {
        DashboardUnit unit = unitRepo.findById(unitId)
                .orElseThrow(() -> new ResourceNotFoundException("Unit not found"));
        verifyOwnership(unit.getProperty().getUser().getId(), user.getId());
        unitRepo.delete(unit);
    }

    // ─── Leases ──────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getLeases(User user) {
        List<DashboardLease> leases = leaseRepo.findAllByUserId(user.getId());
        return leases.stream().map(this::leaseToMap).collect(Collectors.toList());
    }

    @Transactional
    public DashboardLease createLease(User user, UUID unitId, String tenantName, String whatsappNumber, String startDate) {
        DashboardUnit unit = unitRepo.findById(unitId)
                .orElseThrow(() -> new ResourceNotFoundException("Unit not found"));
        verifyOwnership(unit.getProperty().getUser().getId(), user.getId());

        // Check unit is vacant
        if (!unit.getIsVacant()) {
            throw new IllegalStateException("Unit already has an active tenant");
        }

        DashboardLease lease = DashboardLease.builder()
                .unit(unit)
                .tenantName(tenantName)
                .whatsappNumber(whatsappNumber)
                .startDate(java.time.LocalDate.parse(startDate))
                .build();
        DashboardLease saved = leaseRepo.save(lease);

        // Mark unit as occupied
        unit.setIsVacant(false);
        unitRepo.save(unit);

        return saved;
    }

    @Transactional
    public DashboardLease updateLease(UUID leaseId, User user, String tenantName, String whatsappNumber, String startDate) {
        DashboardLease lease = leaseRepo.findById(leaseId)
                .orElseThrow(() -> new ResourceNotFoundException("Lease not found"));
        verifyOwnership(lease.getUnit().getProperty().getUser().getId(), user.getId());
        lease.setTenantName(tenantName);
        lease.setWhatsappNumber(whatsappNumber);
        if (startDate != null) {
            lease.setStartDate(java.time.LocalDate.parse(startDate));
        }
        return leaseRepo.save(lease);
    }

    @Transactional
    public void deleteLease(UUID leaseId, User user) {
        DashboardLease lease = leaseRepo.findById(leaseId)
                .orElseThrow(() -> new ResourceNotFoundException("Lease not found"));
        verifyOwnership(lease.getUnit().getProperty().getUser().getId(), user.getId());

        // Mark unit as vacant again
        DashboardUnit unit = lease.getUnit();
        unit.setIsVacant(true);
        unitRepo.save(unit);

        leaseRepo.delete(lease);
    }

    // ─── Rent Records ────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<RentRecord> getRentRecords(UUID leaseId) {
        return rentRecordRepo.findByLeaseIdOrderByCreatedAtDesc(leaseId);
    }

    @Transactional
    public RentRecord createRentRecord(User user, UUID leaseId, String periodLabel, BigDecimal amount) {
        DashboardLease lease = leaseRepo.findById(leaseId)
                .orElseThrow(() -> new ResourceNotFoundException("Lease not found"));
        verifyOwnership(lease.getUnit().getProperty().getUser().getId(), user.getId());

        RentRecord record = RentRecord.builder()
                .lease(lease)
                .periodLabel(periodLabel)
                .amount(amount)
                .status("DUE")
                .build();
        return rentRecordRepo.save(record);
    }

    @Transactional
    public RentRecord payRentRecord(UUID recordId, User user) {
        RentRecord record = rentRecordRepo.findById(recordId)
                .orElseThrow(() -> new ResourceNotFoundException("Rent record not found"));
        verifyOwnership(record.getLease().getUnit().getProperty().getUser().getId(), user.getId());

        if ("PAID".equals(record.getStatus())) {
            throw new IllegalStateException("Rent record is already paid");
        }

        record.setStatus("PAID");
        record.setPaidAt(LocalDateTime.now());
        return rentRecordRepo.save(record);
    }

    // ─── Maintenance ─────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getMaintenanceRequests(User user) {
        List<DashboardMaintenanceRequest> requests = maintenanceRepo.findByUserIdOrderByCreatedAtDesc(user.getId());
        return requests.stream().map(this::maintenanceToMap).collect(Collectors.toList());
    }

    @Transactional
    public DashboardMaintenanceRequest createMaintenanceRequest(User user, UUID unitId, String title, String description, String priority, BigDecimal cost) {
        DashboardUnit unit = null;
        if (unitId != null) {
            unit = unitRepo.findById(unitId).orElse(null);
        }

        DashboardMaintenanceRequest request = DashboardMaintenanceRequest.builder()
                .user(user)
                .unit(unit)
                .title(title)
                .description(description)
                .priority(priority != null ? priority : "MEDIUM")
                .cost(cost)
                .status("OPEN")
                .build();
        return maintenanceRepo.save(request);
    }

    @Transactional
    public DashboardMaintenanceRequest updateMaintenanceRequest(UUID requestId, User user, UUID unitId, String title, String description, String priority, BigDecimal cost) {
        DashboardMaintenanceRequest request = maintenanceRepo.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Maintenance request not found"));
        verifyOwnership(request.getUser().getId(), user.getId());

        if (unitId != null) {
            DashboardUnit unit = unitRepo.findById(unitId).orElse(null);
            request.setUnit(unit);
        }
        request.setTitle(title);
        request.setDescription(description);
        request.setPriority(priority != null ? priority : "MEDIUM");
        request.setCost(cost);
        return maintenanceRepo.save(request);
    }

    @Transactional
    public DashboardMaintenanceRequest updateMaintenanceStatus(UUID requestId, User user, String status) {
        DashboardMaintenanceRequest request = maintenanceRepo.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Maintenance request not found"));
        verifyOwnership(request.getUser().getId(), user.getId());

        request.setStatus(status);
        if ("RESOLVED".equals(status)) {
            request.setResolvedAt(LocalDateTime.now());
        } else {
            request.setResolvedAt(null);
        }
        return maintenanceRepo.save(request);
    }

    @Transactional
    public void deleteMaintenanceRequest(UUID requestId, User user) {
        DashboardMaintenanceRequest request = maintenanceRepo.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Maintenance request not found"));
        verifyOwnership(request.getUser().getId(), user.getId());
        maintenanceRepo.delete(request);
    }

    // ─── Expenditures ────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<DashboardExpenditure> getExpenditures(User user) {
        return expenditureRepo.findByUserIdOrderByCreatedAtDesc(user.getId());
    }

    @Transactional
    public DashboardExpenditure createExpenditure(User user, String name, BigDecimal cost) {
        DashboardExpenditure expenditure = DashboardExpenditure.builder()
                .user(user)
                .name(name)
                .cost(cost)
                .build();
        return expenditureRepo.save(expenditure);
    }

    @Transactional
    public DashboardExpenditure updateExpenditure(UUID expenditureId, User user, String name, BigDecimal cost) {
        DashboardExpenditure expenditure = expenditureRepo.findById(expenditureId)
                .orElseThrow(() -> new ResourceNotFoundException("Expenditure not found"));
        verifyOwnership(expenditure.getUser().getId(), user.getId());
        expenditure.setName(name);
        expenditure.setCost(cost);
        return expenditureRepo.save(expenditure);
    }

    @Transactional
    public void deleteExpenditure(UUID expenditureId, User user) {
        DashboardExpenditure expenditure = expenditureRepo.findById(expenditureId)
                .orElseThrow(() -> new ResourceNotFoundException("Expenditure not found"));
        verifyOwnership(expenditure.getUser().getId(), user.getId());
        expenditureRepo.delete(expenditure);
    }

    // ─── Announcements ───────────────────────────────────────

    @Transactional(readOnly = true)
    public List<DashboardAnnouncement> getAnnouncements(User user) {
        return announcementRepo.findByUserIdOrderByCreatedAtDesc(user.getId());
    }

    @Transactional
    public DashboardAnnouncement createAnnouncement(User user, String text) {
        DashboardAnnouncement announcement = DashboardAnnouncement.builder()
                .user(user)
                .text(text)
                .build();
        return announcementRepo.save(announcement);
    }

    @Transactional
    public void deleteAnnouncement(UUID announcementId, User user) {
        DashboardAnnouncement announcement = announcementRepo.findById(announcementId)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement not found"));
        verifyOwnership(announcement.getUser().getId(), user.getId());
        announcementRepo.delete(announcement);
    }

    // ─── Helpers ─────────────────────────────────────────────

    private void verifyOwnership(UUID ownerId, UUID userId) {
        if (!ownerId.equals(userId)) {
            throw new AccessDeniedException("You do not own this resource");
        }
    }

    private Map<String, Object> leaseToMap(DashboardLease lease) {
        DashboardUnit unit = lease.getUnit();
        DashboardProperty property = unit.getProperty();
        List<RentRecord> dueRecords = rentRecordRepo.findDueByLeaseId(lease.getId());

        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", lease.getId());
        map.put("tenantName", lease.getTenantName());
        map.put("whatsappNumber", lease.getWhatsappNumber());
        map.put("startDate", lease.getStartDate().toString());
        map.put("unitId", unit.getId());
        map.put("unitName", unit.getName());
        map.put("propertyId", property.getId());
        map.put("propertyName", property.getName());
        map.put("rentAmount", unit.getRentAmount());
        map.put("rentPeriod", unit.getRentPeriod());
        map.put("collectionDay", unit.getCollectionDay());
        map.put("monthsDue", dueRecords.size());
        map.put("rentStatus", dueRecords.isEmpty() ? "PAID" : (dueRecords.size() == 1 ? "DUE" : "DUE ×" + dueRecords.size()));
        map.put("dueRecords", dueRecords.stream().map(r -> {
            Map<String, Object> rm = new LinkedHashMap<>();
            rm.put("id", r.getId());
            rm.put("periodLabel", r.getPeriodLabel());
            rm.put("amount", r.getAmount());
            rm.put("status", r.getStatus());
            return rm;
        }).collect(Collectors.toList()));
        map.put("createdAt", lease.getCreatedAt());
        return map;
    }

    private Map<String, Object> maintenanceToMap(DashboardMaintenanceRequest req) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", req.getId());
        map.put("title", req.getTitle());
        map.put("description", req.getDescription());
        map.put("priority", req.getPriority());
        map.put("cost", req.getCost());
        map.put("status", req.getStatus());
        map.put("resolvedAt", req.getResolvedAt());
        map.put("createdAt", req.getCreatedAt());
        if (req.getUnit() != null) {
            map.put("unitId", req.getUnit().getId());
            map.put("unitName", req.getUnit().getName());
            map.put("propertyName", req.getUnit().getProperty().getName());
        }
        return map;
    }
}
