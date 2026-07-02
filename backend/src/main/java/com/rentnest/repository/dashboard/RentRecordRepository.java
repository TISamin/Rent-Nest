package com.rentnest.repository.dashboard;

import com.rentnest.model.dashboard.RentRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface RentRecordRepository extends JpaRepository<RentRecord, UUID> {
    List<RentRecord> findByLeaseIdOrderByCreatedAtDesc(UUID leaseId);

    @Query("SELECT r FROM RentRecord r WHERE r.lease.id = :leaseId AND r.status = 'DUE' ORDER BY r.createdAt ASC")
    List<RentRecord> findDueByLeaseId(@Param("leaseId") UUID leaseId);

    @Query("SELECT COALESCE(SUM(r.amount), 0) FROM RentRecord r JOIN r.lease l JOIN l.unit u JOIN u.property p WHERE p.user.id = :userId AND r.status = 'PAID'")
    BigDecimal sumPaidByUserId(@Param("userId") UUID userId);

    @Query("SELECT r FROM RentRecord r JOIN r.lease l JOIN l.unit u JOIN u.property p WHERE p.user.id = :userId AND r.status = 'PAID' ORDER BY r.paidAt DESC")
    List<RentRecord> findAllPaidByUserId(@Param("userId") UUID userId);

    @Query("SELECT r FROM RentRecord r JOIN r.lease l JOIN l.unit u JOIN u.property p WHERE p.user.id = :userId ORDER BY r.createdAt DESC")
    List<RentRecord> findAllByUserId(@Param("userId") UUID userId);
}
