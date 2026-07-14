enum SubscriptionStatusValue {
  none,
  incomplete,
  active,
  pastDue,
  canceled,
  unpaid,
}

SubscriptionStatusValue _parseStatus(String raw) {
  switch (raw) {
    case 'active':
      return SubscriptionStatusValue.active;
    case 'incomplete':
      return SubscriptionStatusValue.incomplete;
    case 'past_due':
      return SubscriptionStatusValue.pastDue;
    case 'canceled':
      return SubscriptionStatusValue.canceled;
    case 'unpaid':
      return SubscriptionStatusValue.unpaid;
    default:
      return SubscriptionStatusValue.none;
  }
}

class SubscriptionStatus {
  final SubscriptionStatusValue status;
  final DateTime? currentPeriodEnd;
  final bool cancelAtPeriodEnd;

  const SubscriptionStatus({
    required this.status,
    this.currentPeriodEnd,
    this.cancelAtPeriodEnd = false,
  });

  bool get isActive => status == SubscriptionStatusValue.active;

  factory SubscriptionStatus.fromJson(Map<String, dynamic> json) {
    return SubscriptionStatus(
      status: _parseStatus(json['status'] as String),
      currentPeriodEnd: json['currentPeriodEnd'] != null
          ? DateTime.parse(json['currentPeriodEnd'] as String)
          : null,
      cancelAtPeriodEnd: json['cancelAtPeriodEnd'] as bool? ?? false,
    );
  }
}
