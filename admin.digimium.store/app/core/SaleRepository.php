<?php
declare(strict_types=1);

namespace Digimium\Core;

use PDO;

final class SaleRepository
{
    private const INLINE_COLS = ['customer', 'email', 'manager', 'note'];

    public function __construct(
        private readonly PDO    $pdo,
        private readonly string $table,
        private readonly bool   $isWholesale = false
    ) {}

    public static function retail(PDO $pdo): self
    {
        return new self($pdo, 'sale_overview', false);
    }

    public static function wholesale(PDO $pdo): self
    {
        return new self($pdo, 'ws_sale_overview', true);
    }

    public function fingerprint(): string
    {
        $fp = $this->pdo->query(
            "SELECT COALESCE(MAX(sale_id),0) AS max_id, COUNT(*) AS cnt FROM {$this->table}"
        )->fetch();
        return ((int)($fp['max_id'] ?? 0)) . ':' . ((int)($fp['cnt'] ?? 0));
    }

    private function selectCols(): string
    {
        return $this->isWholesale
            ? 'sale_id, sale_product, duration, quantity, renew, customer, email, purchased_date, expired_date, manager, note, price, profit'
            : 'sale_id, sale_product, duration, renew, customer, email, purchased_date, expired_date, manager, note, price, store';
    }

    private function normalizeRow(array $r): array
    {
        $r['sale_id']        = isset($r['sale_id'])        ? (int)$r['sale_id']    : null;
        $r['duration']       = isset($r['duration'])       ? (int)$r['duration']   : null;
        $r['renew']          = isset($r['renew'])          ? (int)$r['renew']      : 0;
        $r['price']          = isset($r['price'])          ? (float)$r['price']    : 0.0;
        $r['sale_product']   = $r['sale_product']          ?? null;
        $r['customer']       = $r['customer']              ?? null;
        $r['email']          = $r['email']                 ?? null;
        $r['purchased_date'] = $r['purchased_date']        ?? null;
        $r['expired_date']   = $r['expired_date']          ?? null;
        $r['manager']        = $r['manager']               ?? null;
        $r['note']           = $r['note']                  ?? null;
        if ($this->isWholesale) {
            $r['quantity'] = isset($r['quantity']) ? (int)$r['quantity']   : 1;
            $r['profit']   = isset($r['profit'])   ? (float)$r['profit']   : 0.0;
        } else {
            $r['store'] = isset($r['store']) ? (int)$r['store'] : 0;
        }
        return $r;
    }

    /**
     * Cursor-paginated listing.
     *
     * @return array{rows: list<array>, hasMore: bool, nextCursor: string|null}
     */
    public function getPage(int $limit, int $offset, string $cursor): array
    {
        $cursorDate = null;
        $cursorId   = null;
        if ($cursor !== '') {
            $decoded = base64_decode(strtr($cursor, '-_', '+/'), true);
            if (is_string($decoded) && str_contains($decoded, '|')) {
                [$cd, $ci] = explode('|', $decoded, 2);
                $cd = trim($cd);
                $ci = trim($ci);
                if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $cd) && ctype_digit($ci)) {
                    $cursorDate = $cd;
                    $cursorId   = (int)$ci;
                }
            }
        }

        $sql    = 'SELECT ' . $this->selectCols() . " FROM {$this->table}";
        $where  = [];
        $params = [];
        if ($cursorDate !== null) {
            $where[]             = '(purchased_date < :cursor_date OR (purchased_date = :cursor_date2 AND sale_id < :cursor_id))';
            $params[':cursor_date']  = $cursorDate;
            $params[':cursor_date2'] = $cursorDate;
            $params[':cursor_id']    = $cursorId;
        }
        if ($where) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }
        $sql .= ' ORDER BY purchased_date DESC, sale_id DESC';

        if ($cursor === '' && $offset > 0) {
            $sql  .= ' LIMIT :limit OFFSET :offset';
            $stmt  = $this->pdo->prepare($sql);
            foreach ($params as $k => $v) {
                $stmt->bindValue($k, $v);
            }
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        } else {
            $sql  .= ' LIMIT :limit_plus_one';
            $stmt  = $this->pdo->prepare($sql);
            foreach ($params as $k => $v) {
                $stmt->bindValue($k, $v);
            }
            $stmt->bindValue(':limit_plus_one', $limit + 1, PDO::PARAM_INT);
        }
        $stmt->execute();

        $rows    = $stmt->fetchAll();
        $hasMore = false;
        if ($cursor !== '' || $offset === 0) {
            if (count($rows) > $limit) {
                $hasMore = true;
                array_pop($rows);
            }
        }

        $rows = array_map(fn($r) => $this->normalizeRow($r), $rows);

        $nextCursor = null;
        if ($hasMore && !empty($rows)) {
            $last       = $rows[count($rows) - 1];
            $token      = ($last['purchased_date'] ?? '') . '|' . (string)($last['sale_id'] ?? '');
            $nextCursor = rtrim(strtr(base64_encode($token), '+/', '-_'), '=');
        }

        return ['rows' => $rows, 'hasMore' => $hasMore, 'nextCursor' => $nextCursor];
    }

    public function insert(array $v): int
    {
        if ($this->isWholesale) {
            $this->pdo->prepare(
                "INSERT INTO {$this->table}
                     (sale_product, duration, quantity, renew, customer, email,
                      purchased_date, expired_date, manager, note, price, profit)
                 VALUES (:sale_product, :duration, :quantity, :renew, :customer, :email,
                         :purchased_date, :expired_date, :manager, :note, :price, :profit)"
            )->execute([
                ':sale_product'   => $v['sale_product'],
                ':duration'       => $v['duration'],
                ':quantity'       => $v['quantity'],
                ':renew'          => $v['renew'],
                ':customer'       => $v['customer'],
                ':email'          => $v['email'],
                ':purchased_date' => $v['purchased_date'],
                ':expired_date'   => $v['expired_date'],
                ':manager'        => $v['manager'],
                ':note'           => $v['note'],
                ':price'          => $v['price'],
                ':profit'         => $v['profit'],
            ]);
        } else {
            $this->pdo->prepare(
                "INSERT INTO {$this->table}
                     (sale_product, duration, renew, customer, email,
                      purchased_date, expired_date, manager, note, price, profit, store)
                 VALUES (:sale_product, :duration, :renew, :customer, :email,
                         :purchased_date, :expired_date, :manager, :note, :price, :profit, :store)"
            )->execute([
                ':sale_product'   => $v['sale_product'],
                ':duration'       => $v['duration'],
                ':renew'          => $v['renew'],
                ':customer'       => $v['customer'],
                ':email'          => $v['email'],
                ':purchased_date' => $v['purchased_date'],
                ':expired_date'   => $v['expired_date'],
                ':manager'        => $v['manager'],
                ':note'           => $v['note'],
                ':price'          => $v['price'],
                ':profit'         => $v['profit'],
                ':store'          => $v['store'],
            ]);
        }
        return (int)$this->pdo->lastInsertId();
    }

    public function findById(int $id): array|false
    {
        $stmt = $this->pdo->prepare("SELECT sale_id FROM {$this->table} WHERE sale_id = :id");
        $stmt->execute([':id' => $id]);
        return $stmt->fetch();
    }

    public function delete(int $id): void
    {
        $stmt = $this->pdo->prepare("DELETE FROM {$this->table} WHERE sale_id = :id");
        $stmt->execute([':id' => $id]);
        if ($stmt->rowCount() === 0) {
            throw new NotFoundException('Record not found.');
        }
    }

    /**
     * Inline text-field update. Accepts a map of up to 4 allowed columns.
     * Returns false when the record does not exist.
     *
     * @param array<string,string|null> $updates e.g. ['customer' => 'Alice', 'note' => null]
     */
    public function updateInlineFields(int $id, array $updates): bool
    {
        if (!$this->findById($id)) {
            return false;
        }
        $setParts = [];
        $values   = [];
        foreach (self::INLINE_COLS as $col) {
            if (array_key_exists($col, $updates)) {
                $setParts[] = "$col = ?";
                $values[]   = $updates[$col];
            }
        }
        if (empty($setParts)) {
            return true;
        }
        $values[] = $id;
        $this->pdo->prepare(
            'UPDATE ' . $this->table . ' SET ' . implode(', ', $setParts) . ' WHERE sale_id = ?'
        )->execute($values);
        return true;
    }

    // Simple full SELECT used by ws_sales_minimal.
    public function getMinimal(): array
    {
        $stmt = $this->pdo->query(
            "SELECT sale_id, sale_product, price, profit, purchased_date, expired_date,
                    customer, email, renew, duration
             FROM {$this->table} ORDER BY purchased_date DESC, sale_id DESC"
        );
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as &$r) {
            $r['sale_id']        = isset($r['sale_id'])        ? (int)$r['sale_id']    : null;
            $r['sale_product']   = $r['sale_product']          ?? null;
            $r['price']          = isset($r['price'])          ? (float)$r['price']    : 0.0;
            $r['profit']         = isset($r['profit'])         ? (float)$r['profit']   : 0.0;
            $r['purchased_date'] = $r['purchased_date']        ?? null;
            $r['expired_date']   = $r['expired_date']          ?? null;
            $r['customer']       = $r['customer']              ?? null;
            $r['email']          = $r['email']                 ?? null;
            $r['renew']          = isset($r['renew'])          ? (int)$r['renew']      : 0;
            $r['duration']       = isset($r['duration'])       ? (int)$r['duration']   : null;
        }
        unset($r);
        return $rows;
    }
}
